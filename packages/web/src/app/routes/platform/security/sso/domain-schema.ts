import { formErrors } from '@activepieces/shared';
import { z } from 'zod';

export const domainSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .hostname(formErrors.invalidDomain)
      .max(253, formErrors.invalidDomain)
      .refine((value) => value.includes('.'), formErrors.invalidDomain),
  );
