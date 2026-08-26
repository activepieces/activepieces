import type { ActionClassification } from '@activepieces/pieces-framework';
import { t } from 'i18next';

export const ACTION_CLASSIFICATION_BADGES: Record<
  ActionClassification,
  { label: () => string; variant: 'accent' | 'destructive' }
> = {
  READ: { label: () => t('Read'), variant: 'accent' },
  SEARCH: { label: () => t('Search'), variant: 'accent' },
  WRITE: { label: () => t('Write'), variant: 'accent' },
  DESTRUCTIVE: { label: () => t('Destructive'), variant: 'destructive' },
};
