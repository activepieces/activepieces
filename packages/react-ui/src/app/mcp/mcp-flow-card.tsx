import { t } from 'i18next';
import { Calendar } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { formatUtils, cn } from '@/lib/utils';
import {
  FlowStatus,
  PopulatedFlow,
  STATUS_COLORS,
  STATUS_VARIANT,
} from '@activepieces/shared';

type McpFlowCardProps = {
  flow: PopulatedFlow;
  onClick: () => void;
};

export const McpFlowCard = ({ flow, onClick }: McpFlowCardProps) => {
  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200 relative border-border cursor-pointer h-full',
        'hover:shadow-md hover:border-primary/30 hover:bg-accent/10',
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground truncate text-sm min-w-0 flex-1">
              {flow.version.displayName}
            </h4>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground flex-shrink-0">
              <Calendar className="h-3 w-3" />
              <span className="whitespace-nowrap">
                {formatUtils.formatDate(new Date(flow.created))}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mb-2 h-5">
            {flow.version.trigger.settings?.input?.toolName || (
              <span className="text-muted-foreground/70 italic">
                {t('Unnamed tool')}
              </span>
            )}
          </div>

          <div className="w-full">
            <div className="w-full flex items-center gap-2 justify-between">
              <div className="flex items-start py-1 flex-1 min-w-0 overflow-hidden">
                <PieceIconList
                  trigger={flow.version.trigger}
                  maxNumberOfIconsToShow={3}
                  size="md"
                />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    style={{
                      backgroundColor:
                        flow.status === FlowStatus.ENABLED
                          ? STATUS_COLORS[STATUS_VARIANT.POSITIVE].color
                          : STATUS_COLORS[STATUS_VARIANT.NEGATIVE].color,
                      color:
                        flow.status === FlowStatus.ENABLED
                          ? STATUS_COLORS[STATUS_VARIANT.POSITIVE].textColor
                          : STATUS_COLORS[STATUS_VARIANT.NEGATIVE].textColor,
                    }}
                    className="text-xs px-2 py-1 rounded-sm flex-shrink-0 cursor-help"
                  >
                    {flow.status === FlowStatus.ENABLED
                      ? t('Enabled')
                      : t('Disabled')}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {flow.status === FlowStatus.ENABLED
                    ? t('This flow is enabled')
                    : t('Enable this flow to make it available')}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
