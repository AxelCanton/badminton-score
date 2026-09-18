import { Permission } from "@prisma/client";

export { Permission };

/** Libellés affichés dans l'interface d'administration. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  MANAGE_USERS: "Gérer les comptes et les droits",
  RECORD_MATCH: "Enregistrer des matchs",
};

/** Ordre d'affichage stable des droits dans les formulaires. */
export const ALL_PERMISSIONS: Permission[] = [
  Permission.MANAGE_USERS,
  Permission.RECORD_MATCH,
];

export function isPermission(value: unknown): value is Permission {
  return (
    typeof value === "string" &&
    (ALL_PERMISSIONS as string[]).includes(value)
  );
}
