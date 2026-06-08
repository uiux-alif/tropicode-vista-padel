import { getAdminSession } from "@/lib/session";
import { Sidebar } from "@/components/admin/Sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already redirects unauthenticated requests to /admin/login.
  // The layout just needs to wrap authenticated pages with the sidebar,
  // and render unauthenticated pages (i.e. the login page) bare.
  const session = await getAdminSession();

  if (!session) {
    // No sidebar — login page handles its own full-screen layout.
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6f7]">
      <Sidebar email={session.email} />
      <div className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
