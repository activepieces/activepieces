import {
  AppConnectionWithoutSensitiveData,
  ConnectionReplaceSource,
  TelemetryEventName,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Plug } from 'lucide-react';
import { useState } from 'react';

import { flowCanvasHooks } from '@/app/builder/flow-canvas/hooks';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { appConnectionsHooks } from '@/features/connections';
import { PieceIconWithPieceName } from '@/features/pieces';

import { ReplaceConnectionForFlowDialog } from './replace-connection-for-flow-dialog';

export const FlowConnectionsPopover = ({
  isFlowLocked,
}: {
  isFlowLocked: boolean;
}) => {
  const { flowConnections, isError, refetch } =
    flowCanvasHooks.useFlowConnections();
  const { showReplace, hasPermissionToReplace } =
    appConnectionsHooks.useReplaceConnectionAccess();
  const { capture } = useTelemetry();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [connectionToReplace, setConnectionToReplace] =
    useState<AppConnectionWithoutSensitiveData | null>(null);

  if (flowConnections.length === 0 && !isError) {
    return null;
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost">
            <Plug className="w-4 h-4" />
            {t('Connections')}
            {!isError && (
              <span className="text-gray-11">{flowConnections.length}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[340px] p-0">
          <PopoverHeader className="border-b px-4 py-3">
            <PopoverTitle>{t('Connections in this flow')}</PopoverTitle>
            {showReplace && (
              <PopoverDescription className="text-xs">
                {t('Replacing a connection updates every step that uses it.')}
              </PopoverDescription>
            )}
          </PopoverHeader>
          {isError ? (
            <DataFetchErrorState
              entity={t('connections')}
              onRetry={refetch}
              className="py-6"
            />
          ) : (
            <ScrollArea viewPortClassName="max-h-[320px]">
              <div className="flex flex-col gap-1 p-2">
                {flowConnections.map(({ connection, stepCount }) => (
                  <div
                    key={connection.id}
                    className="flex items-center gap-3 rounded-md px-2 py-2"
                  >
                    <PieceIconWithPieceName
                      pieceName={connection.pieceName}
                      size="sm"
                      border={false}
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <TextWithTooltip tooltipMessage={connection.displayName}>
                        <p className="truncate text-sm">
                          {connection.displayName}
                        </p>
                      </TextWithTooltip>
                      <span className="text-xs text-gray-11">
                        {t('usedInStepsCount', { count: stepCount })}
                      </span>
                    </div>
                    {showReplace && (
                      <PermissionNeededTooltip
                        hasPermission={hasPermissionToReplace}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!hasPermissionToReplace || isFlowLocked}
                          onClick={() => {
                            setPopoverOpen(false);
                            setConnectionToReplace(connection);
                            capture({
                              name: TelemetryEventName.CONNECTION_REPLACE_OPENED,
                              payload: {
                                source:
                                  ConnectionReplaceSource.BUILDER_CONNECTIONS_BUTTON,
                                pieceName: connection.pieceName,
                              },
                            });
                          }}
                        >
                          {t('Replace')}
                        </Button>
                      </PermissionNeededTooltip>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>
      {connectionToReplace && (
        <ReplaceConnectionForFlowDialog
          sourceConnection={connectionToReplace}
          source={ConnectionReplaceSource.BUILDER_CONNECTIONS_BUTTON}
          open
          onOpenChange={(open) => {
            if (!open) {
              setConnectionToReplace(null);
            }
          }}
        />
      )}
    </>
  );
};
