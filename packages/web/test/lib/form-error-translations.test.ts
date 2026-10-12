import { formErrors } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { formErrorTranslations } from '@/lib/form-error-translations';

describe('formErrorTranslations', () => {
  it('passes each formErrors key to t under its own name', () => {
    expect(formErrorTranslations.translateAll()).toEqual(formErrors);
  });
});
