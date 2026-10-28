import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge needs to know about custom theme groups so it de-duplicates
 * e.g. `text-2xs` vs `text-sm` correctly.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['2xs'],
      shadow: ['glow'],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Shared focus ring so every interactive element looks identical when focused. */
export const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';
