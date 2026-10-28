import { z } from 'zod';
import { usernameSchema } from './auth';

export const profileVisibilitySchema = z.enum(['private', 'public']);

export const profileUpdateSchema = z.object({
  username: usernameSchema.optional(),
  displayName: z.string().trim().min(1).max(40).optional(),
  bio: z.string().trim().max(280).optional(),
  visibility: profileVisibilitySchema.optional(),
});

export const themePreferenceSchema = z.enum(['dark', 'light', 'system']);

export const userPreferencesSchema = z.object({
  theme: themePreferenceSchema,
  reducedMotion: z.boolean(),
  locale: z.string().min(2).max(10),
});

export type ProfileVisibility = z.infer<typeof profileVisibilitySchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
