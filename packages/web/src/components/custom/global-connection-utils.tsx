import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';

import { Alert, AlertDescription } from '../ui/alert';
export const DefaultTag = () => {
  return (
    <div className="text-xss flex items-center justify-center  rounded-lg border border-border px-2.5 py-0.5">
      {t('Default')}
    </div>
  );
};

export const GlobalConnectionWarning = () => {
  return (
    <Alert variant="warning">
      <TriangleAlert className="h-4 w-4" />
      <AlertDescription>
        {t(
          'Deselecting a global connection from a project that has a flow using it, will break the flow.',
        )}
      </AlertDescription>
    </Alert>
  );
};
