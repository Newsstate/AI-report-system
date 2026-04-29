import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="mt-2 text-muted-foreground">Sign in to your account to continue</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="font-medium text-brand-500 hover:text-brand-600">
          Sign up for free
        </Link>
      </p>
    </div>
  );
}
