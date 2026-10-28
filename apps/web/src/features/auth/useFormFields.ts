import { useCallback, useState, type ChangeEvent } from 'react';
import type { z } from 'zod';

type FieldErrors<T> = Partial<Record<keyof T & string, string | undefined>>;

/**
 * Minimal form state + zod validation for string-valued forms. Deliberately
 * small: Phase 0 forms are simple. Adopt a form library in Phase 1 if forms
 * grow complex.
 *
 * `Values` is the form's input shape (all strings); `Out` is what the schema
 * produces after validation.
 */
export function useFormFields<Values extends Record<string, string>, Out>(
  schema: z.ZodType<Out, Values>,
  initial: Values,
) {
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<FieldErrors<Values>>({});

  const bind = useCallback(
    (name: keyof Values & string) => ({
      name,
      value: values[name],
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        setValues((v) => ({ ...v, [name]: next }));
        setErrors((errs) => ({ ...errs, [name]: undefined }));
      },
      error: errors[name],
    }),
    [values, errors],
  );

  const validate = useCallback((): Out | null => {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return result.data;
    }
    const next: FieldErrors<Values> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !(key in next)) {
        next[key as keyof Values & string] = issue.message;
      }
    }
    setErrors(next);
    return null;
  }, [schema, values]);

  return { values, bind, validate };
}
