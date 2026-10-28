import { Search, X } from 'lucide-react';
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn, focusRing } from '../lib/cn';

const inputBase = cn(
  'h-10 w-full min-w-0 rounded-md border border-border-input bg-surface-sunken px-3 text-sm text-fg',
  'placeholder:text-fg-subtle transition-colors duration-(--duration-fast)',
  'hover:border-fg-subtle disabled:cursor-not-allowed disabled:opacity-50',
  'aria-invalid:border-danger aria-invalid:focus-visible:ring-danger',
  focusRing,
);

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Visually hide the label but keep it for screen readers. */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: string | undefined;
  id?: string;
}

/** Labelled text input with hint and error wiring. Always has an accessible name. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hideLabel = false, hint, error, id, className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={cn('text-sm font-medium text-fg', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(inputBase, className)}
        {...props}
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export interface SearchFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
}

/** Search input with leading icon and clear button. The label is visually hidden. */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { label, value, onValueChange, className, placeholder, ...props },
  ref,
) {
  const id = useId();
  return (
    <div className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
      />
      <input
        ref={ref}
        id={id}
        type="search"
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
        }}
        placeholder={placeholder ?? label}
        className={cn(inputBase, 'pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden')}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onValueChange('');
          }}
          aria-label="Clear search"
          className={cn(
            'absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-fg-subtle hover:text-fg',
            focusRing,
          )}
        >
          <X aria-hidden className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
});
