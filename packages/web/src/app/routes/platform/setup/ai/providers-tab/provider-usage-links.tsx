import { t } from 'i18next';
import { BookOpen, ExternalLink } from 'lucide-react';

import { MockProviderStatus } from '../mock/fixtures';

export function ProviderUsageLinks({ status }: { status: MockProviderStatus }) {
  return (
    <span className="flex items-center gap-3">
      {status.usageDashboardUrl && (
        <a
          href={status.usageDashboardUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          <ExternalLink className="size-3 shrink-0" />
          {t('Usage dashboard')}
        </a>
      )}
      {status.monitorGuideUrl && (
        <a
          href={status.monitorGuideUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          <BookOpen className="size-3 shrink-0" />
          {t('How to monitor usage')}
        </a>
      )}
    </span>
  );
}
