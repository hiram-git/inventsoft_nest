'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Warehouse } from 'lucide-react';
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

const createWarehouseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  location: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
});

type CreateWarehouseForm = z.infer<typeof createWarehouseSchema>;

interface WarehouseData {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function WarehousesPage() {
  const [open, setOpen] = useState(false);

  const { data: warehouses = [], isLoading } = useApiQuery<WarehouseData[]>(
    ['warehouses'],
    '/warehouses',
  );

  const createMutation = useApiMutation<WarehouseData, CreateWarehouseForm>(
    '/warehouses',
    'POST',
    [['warehouses']],
  );

  const form = useForm<CreateWarehouseForm>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: { name: '', location: '', description: '' },
  });

  async function onSubmit(data: CreateWarehouseForm) {
    await createMutation.mutateAsync(data);
    form.reset();
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Almacenes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona los almacenes de tu empresa
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo almacén
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear almacén</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" placeholder="Almacén Central" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Zona Industrial, Calle 5 #12"
                  {...form.register('location')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Descripción opcional"
                  {...form.register('description')}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creando...' : 'Crear almacén'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Warehouse className="h-4 w-4" />
            {warehouses.length} almacén{warehouses.length !== 1 ? 'es' : ''} registrado
            {warehouses.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>
          ) : warehouses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay almacenes registrados. Crea el primero.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell className="text-muted-foreground">{w.location ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{w.description ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={w.isActive ? 'success' : 'secondary'}>
                        {w.isActive ? 'Activo' : 'Inactivo'}
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
