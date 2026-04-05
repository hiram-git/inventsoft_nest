'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, PackageCheck, CheckCircle, XCircle, Send } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useApiQuery } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQueryClient } from '@tanstack/react-query';

type POStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';

interface PurchaseOrder {
  id: string;
  status: POStatus;
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  receivedAt: string | null;
  supplier: { id: string; name: string; email: string; phone: string | null };
  warehouse: { id: string; name: string } | null;
  items: { id: string; quantity: number; unitCost: string; product: { id: string; sku: string; name: string } }[];
}
interface WarehouseOption { id: string; name: string }

const statusConfig: Record<POStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  DRAFT:     { label: 'Borrador',  variant: 'secondary' },
  SUBMITTED: { label: 'Enviada',   variant: 'default' },
  APPROVED:  { label: 'Aprobada',  variant: 'warning' },
  RECEIVED:  { label: 'Recibida',  variant: 'success' },
  CANCELLED: { label: 'Cancelada', variant: 'destructive' },
};

const receiveSchema = z.object({
  warehouseId: z.string().min(1, 'Selecciona el almacén destino'),
  notes: z.string().max(500).optional(),
});
type ReceiveForm = z.infer<typeof receiveSchema>;

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [openReceive, setOpenReceive] = useState(false);

  const { data: po, isLoading } = useApiQuery<PurchaseOrder>(['purchase-orders', id], `/purchase-orders/${id}`);
  const { data: warehouses = [] } = useApiQuery<WarehouseOption[]>(['warehouses'], '/warehouses');

  const receiveForm = useForm<ReceiveForm>({
    resolver: zodResolver(receiveSchema),
    defaultValues: { warehouseId: po?.warehouse?.id ?? '', notes: '' },
  });

  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

  async function doAction(action: 'submit' | 'approve' | 'cancel') {
    setLoadingAction(action);
    try {
      const token = await getToken();
      await fetch(`${apiUrl}/purchase-orders/${id}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      await queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    } finally {
      setLoadingAction(null);
    }
  }

  async function onReceive(data: ReceiveForm) {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/purchase-orders/${id}/receive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json() as { message?: string };
      receiveForm.setError('root', { message: err.message ?? 'Error al recibir' });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    await queryClient.invalidateQueries({ queryKey: ['stock'] });
    await queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    setOpenReceive(false);
    router.push('/dashboard/purchases');
  }

  const formatCurrency = (v: string) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(parseFloat(v));

  if (isLoading || !po) {
    return <div className="py-8 text-center text-muted-foreground">Cargando...</div>;
  }

  const cfg = statusConfig[po.status];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/purchases"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Orden de Compra</h1>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <p className="text-muted-foreground text-sm font-mono">{po.id}</p>
          </div>
        </div>

        {/* Acciones según estado */}
        <div className="flex gap-2">
          {po.status === 'DRAFT' && (
            <>
              <Button variant="outline" onClick={() => doAction('submit')} disabled={loadingAction === 'submit'}>
                <Send className="h-4 w-4" />{loadingAction === 'submit' ? 'Enviando...' : 'Enviar para aprobación'}
              </Button>
              <Button variant="ghost" onClick={() => doAction('cancel')} disabled={loadingAction === 'cancel'}>
                <XCircle className="h-4 w-4 text-destructive" />Cancelar
              </Button>
            </>
          )}
          {po.status === 'SUBMITTED' && (
            <>
              <Button onClick={() => doAction('approve')} disabled={loadingAction === 'approve'}>
                <CheckCircle className="h-4 w-4" />{loadingAction === 'approve' ? 'Aprobando...' : 'Aprobar'}
              </Button>
              <Button variant="ghost" onClick={() => doAction('cancel')} disabled={loadingAction === 'cancel'}>
                <XCircle className="h-4 w-4 text-destructive" />Cancelar
              </Button>
            </>
          )}
          {po.status === 'APPROVED' && (
            <Dialog open={openReceive} onOpenChange={setOpenReceive}>
              <DialogTrigger asChild>
                <Button>
                  <PackageCheck className="h-4 w-4" />Recibir mercancía
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar recepción de mercancía</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Al confirmar, se actualizará el stock de todos los ítems en el almacén seleccionado.
                  Esta acción no se puede deshacer.
                </p>
                <form onSubmit={receiveForm.handleSubmit(onReceive)} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Almacén destino *</Label>
                    <Controller
                      control={receiveForm.control}
                      name="warehouseId"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={po.warehouse?.id ?? ''}>
                          <SelectTrigger><SelectValue placeholder="Selecciona almacén" /></SelectTrigger>
                          <SelectContent>
                            {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {receiveForm.formState.errors.warehouseId && (
                      <p className="text-xs text-destructive">{receiveForm.formState.errors.warehouseId.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rec-notes">Notas de recepción</Label>
                    <Input id="rec-notes" placeholder="Ej: Recibido completo, sin daños" {...receiveForm.register('notes')} />
                  </div>
                  {receiveForm.formState.errors.root && (
                    <p className="text-sm text-destructive">{receiveForm.formState.errors.root.message}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpenReceive(false)}>Cancelar</Button>
                    <Button type="submit" disabled={receiveForm.formState.isSubmitting}>
                      {receiveForm.formState.isSubmitting ? 'Procesando...' : 'Confirmar recepción'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Info proveedor */}
        <Card>
          <CardHeader><CardTitle className="text-base">Proveedor</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{po.supplier.name}</p>
            <p className="text-sm text-muted-foreground">{po.supplier.email}</p>
            {po.supplier.phone && <p className="text-sm text-muted-foreground">{po.supplier.phone}</p>}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader><CardTitle className="text-base">Seguimiento</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Creada</span>
              <span>{new Date(po.createdAt).toLocaleString('es-CO')}</span>
            </div>
            {po.submittedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enviada</span>
                <span>{new Date(po.submittedAt).toLocaleString('es-CO')}</span>
              </div>
            )}
            {po.approvedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aprobada</span>
                <span>{new Date(po.approvedAt).toLocaleString('es-CO')}</span>
              </div>
            )}
            {po.receivedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recibida en</span>
                <span className="font-medium">{po.warehouse?.name} · {new Date(po.receivedAt).toLocaleString('es-CO')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ítems */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ítems</CardTitle>
          {po.notes && <CardDescription>{po.notes}</CardDescription>}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Costo unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.product.sku}</TableCell>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(String(item.quantity * parseFloat(item.unitCost)))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-4 pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{formatCurrency(po.totalAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
