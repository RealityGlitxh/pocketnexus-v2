import { z } from 'zod';

export const emailSchema = z.email({ message: 'Enter a valid email address.' }).max(254);

/**
 * Client-side password policy. Supabase enforces its own server-side policy;
 * this exists for immediate feedback and must be at least as strict as the
 * project's Auth settings.
 */
export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .max(128, 'Use at most 128 characters.')
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), 'Include at least one letter and one number.');

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Use at least 3 characters.')
  .max(24, 'Use at most 24 characters.')
  .regex(/^[a-zA-Z0-9_]+$/, 'Use letters, numbers, and underscores only.');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
});

export const signUpSchema = z
  .object({
    email: emailSchema,
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export const passwordResetRequestSchema = z.object({ email: emailSchema });

export const passwordUpdateSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;
