import { ErrorCode } from '@activepieces/core-utils';
import { Alert02Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
      <HugeiconsIcon icon={Alert02Icon} />
      <AlertTitle>{t('You cannot see this project')}</AlertTitle>
      <AlertDescription>
        {t(
          'Pick another project above, or ask a platform admin for access to this one.',
        )}
      </AlertDescription>
    </Alert>
  );
}
