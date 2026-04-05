'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const itemSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto'),
  quantity:  z.coerce.number().int().positive('Debe ser > 0'),
  unitCost:  z.coerce.number().min(0, 'Debe ser ≥ 0'),
});

const schema = z.object({
  supplierId:  z.string().min(1, 'Selecciona un proveedor'),
  warehouseId: z.string().optional(),
  notes:       z.string().max(500).optional(),
  items:       z.array(itemSchema).min(1, 'Agrega al menos un ítem'),
});

type Form = z.infer<typeof schema>;

interface Option { id: string; name: string }
interface ProductOption { id: string; sku: string; name: string; unitCost: string }

export default function NewPurchaseOrderPage() {
  const router = useRouter();

  const { data: suppliers  = [] } = useApiQuery<Option[]>(['suppliers'], '/suppliers');
  const { data: warehouses = [] } = useApiQuery<Option[]>(['warehouses'], '/warehouses');
  const { data: products   = [] } = useApiQuery<ProductOption[]>(['products'], '/products');

  const createMutation = useApiMutation<unknown, Form>('/purchase-orders', 'POST', [['purchase-orders']]);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { supplierId: '', warehouseId: '', notes: '', items: [{ productId: '', quantity: 1, unitCost: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  const watchedItems = form.watch('items');
  const total = watchedItems.reduce((sum, i) => sum + (i.quantity || 0) * (i.unitCost || 0), 0);

  // Autocompletar costo al seleccionar producto
  function onProductChange(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (product) form.setValue(`items.${index}.unitCost`, parseFloat(product.unitCost));
    form.setValue(`items.${index}.productId`, productId);
  }

  async function onSubmit(data: Form) {
    await createMutation.mutateAsync(data);
    router.push('/dashboard/purchases');
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(v);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/purchases"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Orden de Compra</h1>
          <p className="text-muted-foreground text-sm">Se crea en estado Borrador</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos generales */}
        <Card>
          <CardHeader><CardTitle className="text-base">Datos generales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Controller
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Selecciona proveedor" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.supplierId && <p className="text-xs text-destructive">{form.formState.errors.supplierId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Almacén destino (opcional)</Label>
              <Controller
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <SelectTrigger><SelectValue placeholder="Se puede definir al recibir" /></SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" placeholder="Observaciones opcionales" {...form.register('notes')} />
            </div>
          </CardContent>
        </Card>

        {/* Ítems */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Ítems de la orden</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ productId: '', quantity: 1, unitCost: 0 })}
            >
              <Plus className="h-4 w-4" />Agregar ítem
            </Button>
          </CardHeader>
          <CardContent>
            {form.formState.errors.items?.root && (
              <p className="text-sm text-destructive mb-3">{form.formState.errors.items.root.message}</p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="w-28">Cantidad</TableHead>
                  <TableHead className="w-36">Costo unitario</TableHead>
                  <TableHead className="w-32 text-right">Subtotal</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const qty  = watchedItems[index]?.quantity  ?? 0;
                  const cost = watchedItems[index]?.unitCost ?? 0;
                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Controller
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field: f }) => (
                            <Select onValueChange={(v) => onProductChange(index, v)} value={f.value}>
                              <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>[{p.sku}] {p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {form.formState.errors.items?.[index]?.productId && (
                          <p className="text-xs text-destructive mt-1">{form.formState.errors.items[index]?.productId?.message}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="1" step="1" {...form.register(`items.${index}.quantity`)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min="0" step="0.01" {...form.register(`items.${index}.unitCost`)} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(qty * cost)}
                      </TableCell>
                      <TableCell>
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex justify-end mt-4 pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total estimado</p>
                <p className="text-2xl font-bold">{formatCurrency(total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {createMutation.isError && (
          <p className="text-sm text-destructive">{createMutation.error.message}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/purchases">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear orden de compra'}
          </Button>
        </div>
      </form>
    </div>
  );
}
