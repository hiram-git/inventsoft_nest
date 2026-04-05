import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Package, Warehouse, BarChart3, TrendingUp, Truck, ShoppingCart } from 'lucide-react';

const navGroups = [
  {
    label: 'Inventario',
    items: [
      { href: '/dashboard/warehouses', label: 'Almacenes', icon: Warehouse },
      { href: '/dashboard/products',   label: 'Productos',  icon: Package },
      { href: '/dashboard/inventory',  label: 'Stock',      icon: TrendingUp },
    ],
  },
  {
    label: 'Compras',
    items: [
      { href: '/dashboard/suppliers', label: 'Proveedores',       icon: Truck },
      { href: '/dashboard/purchases', label: 'Órdenes de Compra', icon: ShoppingCart },
    ],
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold">InventSoft ERP</h1>
          <p className="text-xs text-muted-foreground mt-1">Sistema de Inventario</p>
        </div>
        <nav className="flex-1 p-4 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t">
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
