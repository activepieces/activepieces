import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';

import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
export const DefaultTag = () => {
  return <Badge variant="outline">{t('Default')}</Badge>;
};

export const GlobalConnectionWarning = () => {
  return (
    <Alert variant="warning">
      <TriangleAlert />
      <AlertDescription>
        {t(
          'Deselecting a global connection from a project that has a flow using it, will break the flow.',
        )}
      </AlertDescription>
    </Alert>
  );
};
