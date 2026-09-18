import { requireSession } from "@/lib/dal";

import { Nav } from "./nav";

/**
 * Layout des pages authentifiées.
 * La session est vérifiée ici, mais chaque page et Server Action refait sa
 * propre garde : un layout ne protège pas les routes qu'il englobe.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireSession();

  return (
    <div className="flex flex-1 flex-col">
      <Nav userName={user.name} />
      {children}
    </div>
  );
}
