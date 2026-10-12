import type { ActionClassification } from '@activepieces/pieces-framework';
import { t } from 'i18next';

export const ACTION_CLASSIFICATION_BADGES: Record<
  ActionClassification,
  { label: () => string }
> = {
  READ: { label: () => t('Read') },
  SEARCH: { label: () => t('Search') },
  WRITE: { label: () => t('Write') },
  DESTRUCTIVE: { label: () => t('Destructive') },
};
