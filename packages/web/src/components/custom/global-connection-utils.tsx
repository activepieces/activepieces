import { Alert02Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';

import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
export const DefaultTag = () => {
  return <Badge variant="outline">{t('Default')}</Badge>;
};

export const GlobalConnectionWarning = () => {
  return (
    <Alert variant="warning">
      <HugeiconsIcon icon={Alert02Icon} />
      <AlertDescription>
        {t(
          'Deselecting a global connection from a project that has a flow using it, will break the flow.',
        )}
      </AlertDescription>
    </Alert>
  );
};
