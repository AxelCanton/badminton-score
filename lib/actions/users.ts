"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";
import { Prisma } from "@prisma/client";

import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Permission, isPermission } from "@/lib/permissions";

export type UserFormState = {
  error?: string;
  success?: string;
};

const MIN_PASSWORD_LENGTH = 8;

/**
 * Crée un compte et lui attribue ses droits.
 * Réservé aux comptes disposant de MANAGE_USERS : la garde est ici, car une
 * Server Action est appelable en POST direct sans passer par l'interface.
 */
export async function createUser(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requirePermission(Permission.MANAGE_USERS);

  const name = String(formData.get("name") ?? "").trim();
  // Better Auth cherche l'email en minuscules : on normalise dès l'insertion.
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const permissions = formData.getAll("permissions").filter(isPermission);

  if (!name || !email) {
    return { error: "Le nom et l'email sont obligatoires." };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`,
    };
  }

  const userId = randomUUID();

  try {
    await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        // Pas de flux de vérification par email : l'admin transmet lui-même
        // les identifiants, le compte est donc utilisable immédiatement.
        emailVerified: true,
        accounts: {
          // Le mot de passe vit dans Account (providerId "credential"), et
          // `accountId` doit valoir l'id de l'utilisateur : c'est sur cette
          // égalité que Better Auth retrouve le compte à la connexion.
          create: {
            id: randomUUID(),
            accountId: userId,
            providerId: "credential",
            password: await hashPassword(password),
          },
        },
        permissions: {
          create: permissions.map((permission) => ({
            permission,
            grantedById: session.user.id,
          })),
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Un compte existe déjà avec cet email." };
    }

    throw error;
  }

  revalidatePath("/admin/users");

  return { success: `Compte créé pour ${name}.` };
}

/** Remplace l'ensemble des droits d'un compte par ceux soumis. */
export async function updateUserPermissions(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requirePermission(Permission.MANAGE_USERS);

  const userId = String(formData.get("userId") ?? "");
  const permissions = formData.getAll("permissions").filter(isPermission);

  if (!userId) {
    return { error: "Compte introuvable." };
  }

  // Garde-fou : empêcher le dernier administrateur de se retirer le droit
  // de gestion, ce qui rendrait l'application non administrable.
  if (
    userId === session.user.id &&
    !permissions.includes(Permission.MANAGE_USERS)
  ) {
    const otherAdmins = await prisma.userPermission.count({
      where: {
        permission: Permission.MANAGE_USERS,
        userId: { not: session.user.id },
      },
    });

    if (otherAdmins === 0) {
      return {
        error:
          "Vous êtes le dernier administrateur : accordez d'abord ce droit à un autre compte.",
      };
    }
  }

  await prisma.$transaction([
    prisma.userPermission.deleteMany({
      where: { userId, permission: { notIn: permissions } },
    }),
    ...permissions.map((permission) =>
      prisma.userPermission.upsert({
        where: { userId_permission: { userId, permission } },
        create: { userId, permission, grantedById: session.user.id },
        update: {},
      }),
    ),
  ]);

  revalidatePath("/admin/users");

  return { success: "Droits mis à jour." };
}
