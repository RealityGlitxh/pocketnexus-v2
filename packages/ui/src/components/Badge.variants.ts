import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold tracking-wide uppercase',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-overlay text-fg-muted',
        primary: 'bg-primary-soft text-primary-text',
        accent: 'bg-accent-soft text-accent-text',
        success: 'bg-success-soft text-success-text',
        warning: 'bg-warning-soft text-warning-text',
        danger: 'bg-danger-soft text-danger-text',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);
