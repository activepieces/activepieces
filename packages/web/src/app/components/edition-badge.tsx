import { ApEdition, ApEnvironment, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import { Badge } from '@/components/ui/badge';
import { flagsHooks } from '@/hooks/flags-hooks';

export function EditionBadge() {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: environment } = flagsHooks.useFlag<ApEnvironment>(
    ApFlagId.ENVIRONMENT,
  );

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">{t('Edition')}</span>
      <Badge variant="secondary">{(edition ?? '').toUpperCase()}</Badge>
      <span className="text-muted-foreground">{t('Environment')}</span>
      <Badge variant="outline">{environment ?? ''}</Badge>
    </div>
  );
}
