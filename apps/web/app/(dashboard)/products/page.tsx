'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Package } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const createProductSchema = z.object({
  sku: z.string().min(1, 'El SKU es requerido').max(50),
  name: z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().max(1000).optional(),
  unitCost: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  unitPrice: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
});

type CreateProductForm = z.infer<typeof createProductSchema>;

interface ProductData {
  id: string;
  sku: string;
  name: string;
  description: string;
  unitCost: string;
  unitPrice: string;
  isActive: boolean;
}

export default function ProductsPage() {
  const [open, setOpen] = useState(false);

  const { data: products = [], isLoading } = useApiQuery<ProductData[]>(
    ['products'],
    '/products',
  );

  const createMutation = useApiMutation<ProductData, CreateProductForm>(
    '/products',
    'POST',
    [['products']],
  );

  const form = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { sku: '', name: '', description: '', unitCost: 0, unitPrice: 0 },
  });

  async function onSubmit(data: CreateProductForm) {
    await createMutation.mutateAsync(data);
    form.reset();
    setOpen(false);
  }

  const formatCurrency = (value: string) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(
      parseFloat(value),
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">Catálogo de productos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear producto</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input id="sku" placeholder="PROD-001" {...form.register('sku')} />
                  {form.formState.errors.sku && (
                    <p className="text-xs text-destructive">{form.formState.errors.sku.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" placeholder="Nombre del producto" {...form.register('name')} />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Descripción opcional"
                  {...form.register('description')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitCost">Costo unitario *</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...form.register('unitCost')}
                  />
                  {form.formState.errors.unitCost && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.unitCost.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Precio de venta *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...form.register('unitPrice')}
                  />
                  {form.formState.errors.unitPrice && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.unitPrice.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creando...' : 'Crear producto'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            {products.length} producto{products.length !== 1 ? 's' : ''} en catálogo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay productos registrados. Crea el primero.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Precio venta</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(p.unitCost)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(p.unitPrice)}</TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? 'success' : 'secondary'}>
                        {p.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
