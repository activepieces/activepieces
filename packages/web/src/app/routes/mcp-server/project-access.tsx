import { ErrorCode } from '@activepieces/core-utils';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { api } from '@/lib/api';

export function isProjectAccessError(error: Error | null): boolean {
  return (
    api.isApError(error, ErrorCode.AUTHORIZATION) ||
    api.isApError(error, ErrorCode.PERMISSION_DENIED) ||
    api.isApError(error, ErrorCode.ENTITY_NOT_FOUND)
  );
}

export function ProjectAccessDeniedAlert() {
  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>{t('You cannot see this project')}</AlertTitle>
      <AlertDescription>
        {t(
          'Pick another project above, or ask a platform admin for access to this one.',
        )}
      </AlertDescription>
    </Alert>
  );
}
