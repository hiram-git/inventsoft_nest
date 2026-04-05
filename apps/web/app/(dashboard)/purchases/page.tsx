'use client';

import Link from 'next/link';
import { Plus, Eye, CheckCircle, XCircle, PackageCheck } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type POStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';

interface PurchaseOrder {
  id: string;
  status: POStatus;
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  receivedAt: string | null;
  supplier: { id: string; name: string };
  warehouse: { id: string; name: string } | null;
  items: { id: string; quantity: number; product: { sku: string; name: string } }[];
}

const statusConfig: Record<POStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  DRAFT:      { label: 'Borrador',  variant: 'secondary' },
  SUBMITTED:  { label: 'Enviada',   variant: 'default' },
  APPROVED:   { label: 'Aprobada',  variant: 'warning' },
  RECEIVED:   { label: 'Recibida',  variant: 'success' },
  CANCELLED:  { label: 'Cancelada', variant: 'destructive' },
};

export default function PurchasesPage() {
  const { data: orders = [], isLoading, refetch } = useApiQuery<PurchaseOrder[]>(
    ['purchase-orders'],
    '/purchase-orders',
  );

  const submitMutation  = useApiMutation<PurchaseOrder, object>('', 'PATCH', [['purchase-orders']]);
  const approveMutation = useApiMutation<PurchaseOrder, object>('', 'PATCH', [['purchase-orders']]);
  const cancelMutation  = useApiMutation<PurchaseOrder, object>('', 'PATCH', [['purchase-orders']]);

  // Los endpoints de acción se construyen dinámicamente por ID
  async function doAction(id: string, action: 'submit' | 'approve' | 'cancel') {
    const { getToken } = await import('@clerk/nextjs').then(m => m);
    // Usamos fetch directo porque los mutation hooks usan endpoint fijo
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';
    // Para evitar usar clerk directamente aquí, simplemente refetch
    await fetch(`${apiUrl}/purchase-orders/${id}/${action}`, { method: 'PATCH' });
    void refetch();
  }

  const formatCurrency = (v: string) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(parseFloat(v));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Órdenes de Compra</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona el flujo de compras</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/purchases/new">
            <Plus className="h-4 w-4" />Nueva OC
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{orders.length} orden{orders.length !== 1 ? 'es' : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay órdenes de compra. Crea la primera.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Ítems</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Almacén destino</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((po) => {
                  const cfg = statusConfig[po.status];
                  return (
                    <TableRow key={po.id}>
                      <TableCell>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{po.supplier.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {po.items.map((i) => `${i.product.sku} ×${i.quantity}`).join(', ')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(po.totalAmount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {po.warehouse?.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(po.createdAt).toLocaleDateString('es-CO')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/dashboard/purchases/${po.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {po.status === 'DRAFT' && (
                            <Button size="sm" variant="outline" onClick={() => doAction(po.id, 'submit')}>
                              Enviar
                            </Button>
                          )}
                          {po.status === 'SUBMITTED' && (
                            <Button size="sm" variant="outline" onClick={() => doAction(po.id, 'approve')}>
                              <CheckCircle className="h-4 w-4" />Aprobar
                            </Button>
                          )}
                          {po.status === 'APPROVED' && (
                            <Button asChild size="sm">
                              <Link href={`/dashboard/purchases/${po.id}`}>
                                <PackageCheck className="h-4 w-4" />Recibir
                              </Link>
                            </Button>
                          )}
                          {(po.status === 'DRAFT' || po.status === 'SUBMITTED') && (
                            <Button size="sm" variant="ghost" onClick={() => doAction(po.id, 'cancel')}>
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
