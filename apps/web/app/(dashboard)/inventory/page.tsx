'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowDownToLine, TrendingUp, RefreshCw } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface StockItem {
  id: string;
  quantity: number;
  version: number;
  product: { id: string; sku: string; name: string };
  warehouse: { id: string; name: string };
}

interface StockMovement {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  product: { sku: string; name: string };
  warehouse: { name: string };
}

interface ProductData {
  id: string;
  sku: string;
  name: string;
}

interface WarehouseData {
  id: string;
  name: string;
}

// ─── Schema del formulario ───────────────────────────────────────────────────

const receiveSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto'),
  warehouseId: z.string().min(1, 'Selecciona un almacén'),
  quantity: z.coerce.number().int().positive('Debe ser mayor a 0'),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

type ReceiveForm = z.infer<typeof receiveSchema>;

// ─── Componente principal ─────────────────────────────────────────────────────

export default function InventoryPage() {
  const [openReceive, setOpenReceive] = useState(false);
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');

  const { data: stock = [], isLoading: loadingStock, refetch } = useApiQuery<StockItem[]>(
    ['stock'],
    '/stock',
  );

  const { data: movements = [], isLoading: loadingMovements } = useApiQuery<StockMovement[]>(
    ['stock-movements'],
    '/stock/movements',
  );

  const { data: products = [] } = useApiQuery<ProductData[]>(['products'], '/products');
  const { data: warehouses = [] } = useApiQuery<WarehouseData[]>(['warehouses'], '/warehouses');

  const receiveMutation = useApiMutation<StockMovement, ReceiveForm>(
    '/stock/receive',
    'POST',
    [['stock'], ['stock-movements']],
  );

  const form = useForm<ReceiveForm>({
    resolver: zodResolver(receiveSchema),
    defaultValues: { productId: '', warehouseId: '', quantity: 1, reference: '', notes: '' },
  });

  async function onSubmit(data: ReceiveForm) {
    await receiveMutation.mutateAsync(data);
    form.reset();
    setOpenReceive(false);
  }

  const movementBadge = (type: StockMovement['type']) => {
    if (type === 'IN') return <Badge variant="success">Entrada</Badge>;
    if (type === 'OUT') return <Badge variant="destructive">Salida</Badge>;
    return <Badge variant="secondary">Ajuste</Badge>;
  };

  const stockLevel = (qty: number) => {
    if (qty === 0) return <Badge variant="destructive">Sin stock</Badge>;
    if (qty <= 10) return <Badge variant="warning">{qty}</Badge>;
    return <Badge variant="success">{qty}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Stock actual y movimientos de mercancía
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => void refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={openReceive} onOpenChange={setOpenReceive}>
            <DialogTrigger asChild>
              <Button>
                <ArrowDownToLine className="h-4 w-4" />
                Ingresar mercancía
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ingresar mercancía</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Producto */}
                <div className="space-y-2">
                  <Label>Producto *</Label>
                  <Select
                    onValueChange={(v) => form.setValue('productId', v)}
                    defaultValue=""
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          [{p.sku}] {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.productId && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.productId.message}
                    </p>
                  )}
                </div>

                {/* Almacén */}
                <div className="space-y-2">
                  <Label>Almacén *</Label>
                  <Select
                    onValueChange={(v) => form.setValue('warehouseId', v)}
                    defaultValue=""
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un almacén" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.warehouseId && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.warehouseId.message}
                    </p>
                  )}
                </div>

                {/* Cantidad */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    {...form.register('quantity')}
                  />
                  {form.formState.errors.quantity && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.quantity.message}
                    </p>
                  )}
                </div>

                {/* Referencia */}
                <div className="space-y-2">
                  <Label htmlFor="reference">Referencia (opcional)</Label>
                  <Input
                    id="reference"
                    placeholder="OC-2024-001"
                    {...form.register('reference')}
                  />
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Input
                    id="notes"
                    placeholder="Observaciones del ingreso"
                    {...form.register('notes')}
                  />
                </div>

                {receiveMutation.isError && (
                  <p className="text-sm text-destructive">
                    {receiveMutation.error.message}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenReceive(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={receiveMutation.isPending}>
                    {receiveMutation.isPending ? 'Registrando...' : 'Registrar ingreso'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'stock'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Stock actual
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'movements'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Movimientos
        </button>
      </div>

      {/* Stock actual */}
      {activeTab === 'stock' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Stock por producto y almacén
            </CardTitle>
            <CardDescription>
              Cantidades en tiempo real — se actualiza con cada movimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStock ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>
            ) : stock.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No hay stock registrado. Ingresa mercancía para comenzar.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.product.sku}</TableCell>
                      <TableCell className="font-medium">{item.product.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.warehouse.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {stockLevel(item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Movimientos */}
      {activeTab === 'movements' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de movimientos</CardTitle>
            <CardDescription>Últimos 100 movimientos — log inmutable</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMovements ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>
            ) : movements.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No hay movimientos registrados.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{movementBadge(m.type)}</TableCell>
                      <TableCell className="font-medium">{m.product.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.warehouse.name}
                      </TableCell>
                      <TableCell className="text-right font-mono">{m.quantity}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {m.reference ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(m.createdAt).toLocaleString('es-CO')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
