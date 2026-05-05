import { SecurityAdvisory } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, ShieldAlert } from 'lucide-react';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const SEVERITY_LABEL: Record<SecurityAdvisory['severity'], string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const SEVERITY_BADGE_CLASS: Record<SecurityAdvisory['severity'], string> = {
  critical:
    'bg-destructive-50 text-destructive-700 border-destructive-600 dark:bg-destructive-950 dark:text-destructive-300 dark:border-destructive-400',
  high: 'bg-destructive-50 text-destructive-700 border-destructive-600 dark:bg-destructive-950 dark:text-destructive-300 dark:border-destructive-400',
  medium:
    'bg-warning-50 text-warning-700 border-warning-600 dark:bg-warning-950 dark:text-warning-300 dark:border-warning-400',
  low: 'border-border text-muted-foreground',
};

const AdvisoryItem = ({ advisory }: AdvisoryItemProps) => {
  const fixedIn = advisory.patchedVersion ?? t('No fix yet');
  return (
    <Item variant="outline" className="flex-nowrap">
      <ItemMedia variant="icon">
        <ShieldAlert />
      </ItemMedia>
      <ItemContent className="min-w-0 max-w-[75%]">
        <ItemTitle className="flex w-full items-center gap-2 min-w-0">
          <TextWithTooltip tooltipMessage={advisory.summary}>
            <p className="truncate min-w-0">{advisory.summary}</p>
          </TextWithTooltip>
          <a
            href={advisory.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0"
            aria-label={t('Open advisory')}
          >
            <ExternalLink size={18} />
          </a>
        </ItemTitle>
        <ItemDescription className="text-xs text-muted-foreground">
          <b>{t('Affects')}</b>: {advisory.vulnerableVersionRange}
          {'  '}
          <b>{t('Fixed in')}</b>: {fixedIn}
        </ItemDescription>
      </ItemContent>
      <ItemActions className="ml-auto shrink-0">
        <Badge
          variant="outline"
          className={cn(SEVERITY_BADGE_CLASS[advisory.severity])}
        >
          {t(SEVERITY_LABEL[advisory.severity])}
        </Badge>
      </ItemActions>
    </Item>
  );
};

export { AdvisoryItem };

type AdvisoryItemProps = {
  advisory: SecurityAdvisory;
};
