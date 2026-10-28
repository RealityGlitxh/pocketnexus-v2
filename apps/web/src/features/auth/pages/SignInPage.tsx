import { signInSchema } from '@pocketnexus/shared';
import { Button, TextField } from '@pocketnexus/ui';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { signIn } from '@/services/auth.service';
import { AuthFormShell, FormError } from '../AuthFormShell';
import { useAuth } from '../authContext';
import { safeReturnPath } from '../safeReturnPath';
import { useFormFields } from '../useFormFields';

export function SignInPage() {
  const { state } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { bind, validate } = useFormFields(signInSchema, { email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const returnTo = safeReturnPath(location.state);

  if (state.status === 'signed_in') return <Navigate to={returnTo} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const values = validate();
    if (!values) return;
    setSubmitting(true);
    const result = await signIn(values);
    setSubmitting(false);
    if (result.ok) void navigate(returnTo, { replace: true });
    else setFormError(result.error.message);
  }

  const disabled = state.status === 'disabled';

  return (
    <AuthFormShell
      title="Sign in"
      description="Welcome back, trainer."
      footer={
        <>
          New to PocketNexus?{' '}
          <Link to="/auth/sign-up" className="font-medium text-primary-text hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormError message={formError} />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          disabled={disabled}
          {...bind('email')}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          disabled={disabled}
          {...bind('password')}
        />
        <div className="flex justify-end">
          <Link
            to="/auth/forgot-password"
            className="text-sm text-fg-muted hover:text-fg hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={submitting} disabled={disabled} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthFormShell>
  );
}
