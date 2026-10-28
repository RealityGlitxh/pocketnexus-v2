import { passwordResetRequestSchema } from '@pocketnexus/shared';
import { Button, TextField } from '@pocketnexus/ui';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { requestPasswordReset } from '@/services/auth.service';
import { AuthFormShell, FormError } from '../AuthFormShell';
import { useAuth } from '../authContext';
import { useFormFields } from '../useFormFields';

export function ForgotPasswordPage() {
  const { state } = useAuth();
  const { bind, validate } = useFormFields(passwordResetRequestSchema, { email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const values = validate();
    if (!values) return;
    setSubmitting(true);
    const result = await requestPasswordReset(values);
    setSubmitting(false);
    if (result.ok) setSent(true);
    else setFormError(result.error.message);
  }

  return (
    <AuthFormShell
      title="Reset your password"
      description="We'll email you a link to choose a new password."
      footer={
        <Link to="/auth/sign-in" className="font-medium text-primary-text hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p role="status" className="rounded-md bg-success-soft px-3 py-2 text-sm text-success-text">
          If an account exists for that address, a reset link is on its way.
        </p>
      ) : (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormError message={formError} />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            disabled={state.status === 'disabled'}
            {...bind('email')}
          />
          <Button
            type="submit"
            loading={submitting}
            disabled={state.status === 'disabled'}
            className="w-full"
          >
            Send reset link
          </Button>
        </form>
      )}
    </AuthFormShell>
  );
}
