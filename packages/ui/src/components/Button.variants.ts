import { cva } from 'class-variance-authority';
import { focusRing } from '../lib/cn';

export const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none',
    'transition-[background-color,border-color,color,box-shadow] duration-(--duration-fast) ease-(--ease-out-quint)',
    'disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress',
    '[&_svg]:size-4 [&_svg]:shrink-0',
    focusRing,
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-fg shadow-sm hover:bg-primary-hover hover:shadow-glow active:bg-primary-active',
        secondary:
          'border border-border-strong bg-surface-raised text-fg hover:border-primary/50 hover:bg-surface-overlay',
        ghost: 'text-fg-muted hover:bg-surface-raised hover:text-fg',
        danger: 'bg-danger text-white hover:bg-danger/90',
        link: 'h-auto px-0 text-primary-text underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
