import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { useManagePlanDialogStore } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';

export function FeatureBanner({
  message,
  documentationUrl,
  className,
}: FeatureBannerProps) {
  const { openDialog: openManagePlanDialog } = useManagePlanDialogStore();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCommunity = edition === ApEdition.COMMUNITY;
  const docsUrl = documentationUrl ?? ENTERPRISE_DOCUMENTATION_URL;

  return (
    <Alert variant="primary" className={className}>
      <AlertDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>{message}</span>
        {isCommunity ? (
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary-ink hover:underline"
          >
            {t('Read the docs')}
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => openManagePlanDialog()}
            className="font-medium text-primary-ink hover:underline"
          >
            {t('Upgrade plan')}
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}

const ENTERPRISE_DOCUMENTATION_URL =
  'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional';

export type FeatureBannerProps = {
  message: string;
  documentationUrl?: string;
  className?: string;
};
