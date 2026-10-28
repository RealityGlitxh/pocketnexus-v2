import { signUpSchema } from '@pocketnexus/shared';
import { Button, TextField } from '@pocketnexus/ui';
import { MailCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { signUp } from '@/services/auth.service';
import { AuthFormShell, FormError } from '../AuthFormShell';
import { useAuth } from '../authContext';
import { useFormFields } from '../useFormFields';

export function SignUpPage() {
  const { state } = useAuth();
  const { bind, validate } = useFormFields(signUpSchema, {
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  if (state.status === 'signed_in') return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const values = validate();
    if (!values) return;
    setSubmitting(true);
    const result = await signUp(values);
    setSubmitting(false);
    if (!result.ok) setFormError(result.error.message);
    else if (result.value.needsConfirmation) setCheckEmail(true);
  }

  if (checkEmail) {
    return (
      <AuthFormShell title="Check your email">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <MailCheck aria-hidden className="size-10 text-accent-text" />
          <p className="text-sm text-fg-muted">
            If that address can be used, we've sent a confirmation link. Follow it to activate your
            account, then sign in.
          </p>
          <Button asChild variant="secondary">
            <Link to="/auth/sign-in">Back to sign in</Link>
          </Button>
        </div>
      </AuthFormShell>
    );
  }

  const disabled = state.status === 'disabled';

  return (
    <AuthFormShell
      title="Create your account"
      description="Save decks, track matches, and sync across devices."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/auth/sign-in" className="font-medium text-primary-text hover:underline">
            Sign in
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
          disabled={disabled}
          {...bind('email')}
        />
        <TextField
          label="Username"
          autoComplete="username"
          hint="3–24 characters: letters, numbers, underscores. Shown only if you make your profile public."
          disabled={disabled}
          {...bind('username')}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters, including a letter and a number."
          disabled={disabled}
          {...bind('password')}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          disabled={disabled}
          {...bind('confirmPassword')}
        />
        <Button type="submit" loading={submitting} disabled={disabled} className="w-full">
          Create account
        </Button>
      </form>
    </AuthFormShell>
  );
}
