import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-card p-4">
        <nav>
          <p className="text-sm font-medium text-muted-foreground">Navigation</p>
          {/* Phase 1: populate with context-specific links */}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
