import { EventDestination } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, Globe, Workflow } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatUtils } from '@/lib/format-utils';

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
    <Item variant="outline">
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
      <ItemContent className="min-w-0">
        <TextWithTooltip tooltipMessage={title}>
          <ItemTitle
            className={isInternal ? 'truncate' : 'truncate font-mono text-xs'}
          >
            {title}
          </ItemTitle>
        </TextWithTooltip>
        <ItemDescription className="text-xs !flex flex-wrap items-center gap-x-1 gap-y-2 overflow-visible [text-wrap:unset] mt-1">
          <span className="text-muted-foreground shrink-0 mr-1.5">
            {t('Events')}
          </span>
          {destination.events.map((event) => (
            <Badge key={event} variant="outline" className="text-xs">
              {eventLabels[event]?.label ?? event}
            </Badge>
          ))}
        </ItemDescription>
        <p className="text-xs text-muted-foreground mt-2">
          {t('Created')}{' '}
          {formatUtils.formatDateToAgo(new Date(destination.created))}
        </p>
      </ItemContent>
      <ItemActions>
        {isInternal && flowId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(
                    `/flows/${flowId}`,
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
              >
                <ExternalLink className="size-4" />
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
