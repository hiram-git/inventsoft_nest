import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage(): Promise<React.JSX.Element> {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">InventSoft ERP</h1>
      <p className="mt-4 text-muted-foreground">Enterprise Resource Planning</p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/sign-in"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="rounded-md border border-input px-4 py-2 hover:bg-accent"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
