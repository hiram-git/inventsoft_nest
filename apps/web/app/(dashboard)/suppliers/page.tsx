'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Truck } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const schema = z.object({
  name: z.string().min(1, 'Requerido').max(200),
  email: z.string().email('Email inválido'),
  phone: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
});
type Form = z.infer<typeof schema>;

interface Supplier { id: string; name: string; email: string; phone: string | null; address: string | null; isActive: boolean }

export default function SuppliersPage() {
  const [open, setOpen] = useState(false);
  const { data: suppliers = [], isLoading } = useApiQuery<Supplier[]>(['suppliers'], '/suppliers');
  const createMutation = useApiMutation<Supplier, Form>('/suppliers', 'POST', [['suppliers']]);
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', phone: '', address: '' } });

  async function onSubmit(data: Form) {
    await createMutation.mutateAsync(data);
    form.reset();
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona tus proveedores</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />Nuevo proveedor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear proveedor</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" placeholder="Distribuidora S.A." {...form.register('name')} />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="contacto@proveedor.com" {...form.register('email')} />
                {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" placeholder="+57 300 123 4567" {...form.register('phone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" placeholder="Calle 10 #45-20" {...form.register('address')} />
                </div>
              </div>
              {createMutation.isError && <p className="text-sm text-destructive">{createMutation.error.message}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creando...' : 'Crear proveedor'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4" />{suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>
          ) : suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No hay proveedores. Crea el primero.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email}</TableCell>
                    <TableCell className="text-muted-foreground">{s.phone ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{s.address ?? '—'}</TableCell>
                    <TableCell><Badge variant={s.isActive ? 'success' : 'secondary'}>{s.isActive ? 'Activo' : 'Inactivo'}</Badge></TableCell>
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
