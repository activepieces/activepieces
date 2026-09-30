import { EventDestination } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, Globe, Workflow } from 'lucide-react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { ParsedDestination } from '../lib/parse-flow-id-from-url';
import { EventLabelsMap } from '../lib/use-event-labels';

import EventDestinationActions from './event-destination-actions';

type EventDestinationRowProps = {
  destination: EventDestination;
  parsed: ParsedDestination;
  flowDisplayName: string | undefined;
  eventLabels: EventLabelsMap;
};

export const EventDestinationRow = ({
  destination,
  parsed,
  flowDisplayName,
  eventLabels,
}: EventDestinationRowProps) => {
  const isInternal = parsed.kind === 'flow';
  const flowId = parsed.kind === 'flow' ? parsed.flowId : undefined;
  const title =
    isInternal && flowDisplayName
      ? flowDisplayName
      : isInternal && flowId
      ? t('Destination (flow {flowId})', { flowId })
      : destination.url;

  return (
    <Item className="items-start">
      <ItemMedia variant="icon">
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-flex">
              {isInternal ? <Workflow /> : <Globe />}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {isInternal ? t('Internal Flow') : t('External')}
          </TooltipContent>
        </Tooltip>
      </ItemMedia>
      <ItemContent className="min-w-0 gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <TextWithTooltip tooltipMessage={title}>
            <ItemTitle className={cn('truncate', !isInternal && 'font-mono')}>
              {title}
            </ItemTitle>
          </TextWithTooltip>
          <ItemDescription>
            {t('Created')}{' '}
            {formatUtils.formatDateToAgo(new Date(destination.created))}
          </ItemDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-11">
          <span className="shrink-0">{t('Events')}</span>
          {destination.events.map((event) => (
            <Badge key={event} variant="outline">
              {eventLabels[event]?.label ?? event}
            </Badge>
          ))}
        </div>
      </ItemContent>
      <ItemActions>
        {isInternal && flowId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  window.open(
                    `/flows/${flowId}`,
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
              >
                <ExternalLink />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('View flow')}</TooltipContent>
          </Tooltip>
        )}
        <EventDestinationActions destination={destination} />
      </ItemActions>
    </Item>
  );
};
