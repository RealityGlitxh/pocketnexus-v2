import { passwordUpdateSchema } from '@pocketnexus/shared';
import { Button, Spinner, TextField, useToast } from '@pocketnexus/ui';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { updatePassword } from '@/services/auth.service';
import { AuthFormShell, FormError } from '../AuthFormShell';
import { useAuth } from '../authContext';
import { useFormFields } from '../useFormFields';

/**
 * Landing page for password-reset links. Supabase (PKCE) exchanges the code
 * in the URL for a short-lived session, then the user picks a new password.
 */
export function UpdatePasswordPage() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { bind, validate } = useFormFields(passwordUpdateSchema, {
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const values = validate();
    if (!values) return;
    setSubmitting(true);
    const result = await updatePassword(values);
    setSubmitting(false);
    if (result.ok) {
      toast({ title: 'Password updated', tone: 'success' });
      void navigate('/', { replace: true });
    } else {
      setFormError(result.error.message);
    }
  }

  if (state.status === 'loading') {
    return (
      <AuthFormShell title="Choose a new password">
        <Spinner label="Verifying your reset link" className="justify-center py-6" />
      </AuthFormShell>
    );
  }

  if (state.status === 'signed_out' || state.status === 'error') {
    return (
      <AuthFormShell title="Link expired or invalid">
        <p className="text-sm text-fg-muted">
          This password reset link is no longer valid. Request a new one to continue.
        </p>
        <Button asChild variant="secondary">
          <Link to="/auth/forgot-password">Request a new link</Link>
        </Button>
      </AuthFormShell>
    );
  }

  return (
    <AuthFormShell title="Choose a new password">
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormError message={formError} />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters, including a letter and a number."
          disabled={state.status === 'disabled'}
          {...bind('password')}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          disabled={state.status === 'disabled'}
          {...bind('confirmPassword')}
        />
        <Button
          type="submit"
          loading={submitting}
          disabled={state.status === 'disabled'}
          className="w-full"
        >
          Update password
        </Button>
      </form>
    </AuthFormShell>
  );
}
