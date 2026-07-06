import {
  AppConnectionScope,
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Plus, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { chatApi } from '@/features/chat/lib/chat-api';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { piecesHooks } from '@/features/pieces';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import {
  ConnectionPickerData,
  isConnectionHealthy,
  normalizePieceName,
  pickDefaultConnectionExternalId,
} from '../lib/message-parsers';
import { useConversationId } from '../lib/use-conversation-id';

import { InteractiveCardShell } from './interactive-card-shell';

type PickerConnection = NonNullable<
  ConnectionPickerData['connections']
>[number];

function connectionStatusLabel(status: AppConnectionStatus): string | null {
  if (status === AppConnectionStatus.ERROR) return t('Expired');
  if (status === AppConnectionStatus.MISSING) return t('Missing');
  return null;
}

function SelectedState({
  pieceName,
  connection,
  displayName,
}: {
  pieceName: string;
  connection: PickerConnection;
  displayName: string;
}) {
  return (
    <motion.div
      className="rounded-xl border bg-background overflow-hidden my-2"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-4 flex items-center gap-3">
        <div className="relative">
          <PieceIconWithPieceName
            pieceName={pieceName}
            size="sm"
            border={false}
            showTooltip={false}
          />
          <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5">
            <Check className="h-2 w-2 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{connection.label}</div>
          <div className="text-xs text-muted-foreground">
            {t('Using this {name} account', { name: displayName })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function useLiveConnections({
  connections,
  pieceName,
  enabled,
}: {
  connections: ConnectionPickerData['connections'];
  pieceName: string;
  enabled: boolean;
}): {
  statuses: Record<string, AppConnectionStatus>;
  fullConnections: Record<string, AppConnectionWithoutSensitiveData>;
  isLoading: boolean;
} {
  const [statuses, setStatuses] = useState<Record<string, AppConnectionStatus>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const fullConnectionsRef = useRef<
    Record<string, AppConnectionWithoutSensitiveData>
  >({});

  const projectIdsKey = useMemo(
    () =>
      [...new Set((connections ?? []).map((c) => c.projectId))]
        .sort()
        .join(','),
    [connections],
  );

  useEffect(() => {
    if (!enabled || !projectIdsKey) return;
    let cancelled = false;
    setIsLoading(true);

    const projectIds = projectIdsKey.split(',');

    void Promise.all(
      projectIds.map(async (projectId) => {
        const effectiveProjectId =
          projectId || authenticationSession.getProjectId();
        if (!effectiveProjectId) return [];
        const result = await appConnectionsApi.list({
          projectId: effectiveProjectId,
          pieceName,
          limit: 100,
        });
        return result.data;
      }),
    )
      .then((results) => {
        if (cancelled) return;
        const statusMap: Record<string, AppConnectionStatus> = {};
        const connMap: Record<string, AppConnectionWithoutSensitiveData> = {};
        for (const conns of results) {
          for (const conn of conns) {
            statusMap[conn.externalId] = conn.status;
            connMap[conn.externalId] = conn;
          }
        }
        fullConnectionsRef.current = connMap;
        setStatuses(statusMap);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectIdsKey, pieceName, enabled]);

  return { statuses, fullConnections: fullConnectionsRef.current, isLoading };
}

export function ConnectionPickerCard({
  picker,
  onResolve,
  onDismiss,
  isInteractive = true,
  selectedProjectId,
  selectedConnectionLabel,
}: ConnectionPickerCardProps) {
  const queryClient = useQueryClient();
  const conversationId = useConversationId();
  const pieceName = normalizePieceName(picker.piece);
  const shouldFetch =
    !picker.connections?.length && !!conversationId && isInteractive;
  const { data: fetchedConnections, isLoading: isFetchingConnections } =
    useQuery({
      queryKey: ['chat-picker-connections', conversationId, pieceName],
      queryFn: async () => {
        const conns = await chatApi.getPickerConnections({
          conversationId: conversationId!,
          pieceName,
        });
        return conns.map((c) => ({
          ...c,
          status: c.status as AppConnectionStatus,
        }));
      },
      enabled: shouldFetch,
    });

  const resolvedConnections = picker.connections ?? fetchedConnections ?? [];
  const filteredPicker = useMemo(() => {
    if (!selectedProjectId)
      return { ...picker, connections: resolvedConnections };
    const filtered = resolvedConnections.filter(
      (c) => c.projectId === selectedProjectId,
    );
    return { ...picker, connections: filtered };
  }, [picker, resolvedConnections, selectedProjectId]);
  const { pieceModel, isLoading: isPieceLoading } = piecesHooks.usePiece({
    name: pieceName,
  });
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [reconnectConnection, setReconnectConnection] =
    useState<AppConnectionWithoutSensitiveData | null>(null);
  const [selectedConnection, setSelectedConnection] =
    useState<PickerConnection | null>(null);
  const [userSelectedExternalId, setUserSelectedExternalId] = useState<
    string | null
  >(null);

  const {
    statuses: liveStatuses,
    fullConnections,
    isLoading: isLoadingStatuses,
  } = useLiveConnections({
    connections: filteredPicker.connections,
    pieceName,
    enabled: isInteractive && !selectedConnection,
  });

  const statusOf = (conn: PickerConnection): AppConnectionStatus =>
    liveStatuses[conn.externalId] ?? conn.status;

  const healthyConnections = filteredPicker.connections.filter((c) =>
    isConnectionHealthy(statusOf(c)),
  );

  const defaultExternalId = useMemo(
    () =>
      pickDefaultConnectionExternalId({
        healthy: healthyConnections,
        updatedByExternalId: Object.fromEntries(
          healthyConnections.map((c) => [
            c.externalId,
            fullConnections[c.externalId]?.updated,
          ]),
        ),
      }),
    [healthyConnections, fullConnections],
  );

  const selectedExternalId =
    userSelectedExternalId &&
    healthyConnections.some((c) => c.externalId === userSelectedExternalId)
      ? userSelectedExternalId
      : defaultExternalId;

  const resolveWith = (conn: PickerConnection) => {
    setSelectedConnection(conn);
    onResolve({
      connectionExternalId: conn.externalId,
      projectId: conn.projectId,
      label: conn.label,
    });
  };

  const handleContinue = () => {
    const conn = filteredPicker.connections.find(
      (c) => c.externalId === selectedExternalId,
    );
    if (conn) resolveWith(conn);
  };

  const handleReconnect = (externalId: string) => {
    const fullConnection = fullConnections[externalId];
    if (!fullConnection) return;
    setReconnectConnection(fullConnection);
    setConnectDialogOpen(true);
  };

  const handleNewConnection = () => {
    setReconnectConnection(null);
    setConnectDialogOpen(true);
  };

  if (selectedConnection) {
    return (
      <SelectedState
        pieceName={pieceName}
        connection={selectedConnection}
        displayName={filteredPicker.displayName}
      />
    );
  }

  if (shouldFetch && isFetchingConnections) {
    return null;
  }

  if (!isInteractive) {
    const historyLabel = selectedConnectionLabel ?? filteredPicker.displayName;
    return (
      <SelectedState
        pieceName={pieceName}
        connection={{
          label: historyLabel,
          project: '',
          externalId: '',
          projectId: '',
          status: AppConnectionStatus.ACTIVE,
        }}
        displayName={filteredPicker.displayName}
      />
    );
  }

  const hasConnections = filteredPicker.connections.length > 0;

  return (
    <>
      <InteractiveCardShell
        onDismiss={() => onDismiss?.()}
        title={
          hasConnections
            ? t('Which {name} account should I use?', {
                name: filteredPicker.displayName,
              })
            : t('Connect {name}', { name: filteredPicker.displayName })
        }
      >
        {!hasConnections && (
          <div className="pb-2 text-sm text-muted-foreground">
            {t('No {name} account connected yet', {
              name: filteredPicker.displayName,
            })}
          </div>
        )}

        <RadioGroup
          value={selectedExternalId ?? ''}
          onValueChange={setUserSelectedExternalId}
          className="max-h-64 gap-0 overflow-auto"
        >
          {filteredPicker.connections.map((conn) => {
            const status = statusOf(conn);
            const healthy = isConnectionHealthy(status);
            const isSelected =
              healthy && conn.externalId === selectedExternalId;

            const row = (
              <>
                {healthy ? (
                  <RadioGroupItem
                    value={conn.externalId}
                    id={`conn-${conn.externalId}`}
                  />
                ) : (
                  <PieceIconWithPieceName
                    pieceName={pieceName}
                    size="sm"
                    border={false}
                    showTooltip={false}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {conn.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {healthy
                      ? conn.project
                      : `${conn.project} · ${connectionStatusLabel(status)}`}
                  </div>
                </div>
                {!healthy &&
                  (status === AppConnectionStatus.MISSING ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      disabled={isPieceLoading}
                      onClick={handleNewConnection}
                    >
                      <Plus className="h-3 w-3" />
                      {t('Connect')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      disabled={isPieceLoading || isLoadingStatuses}
                      onClick={() => handleReconnect(conn.externalId)}
                    >
                      <RefreshCw className="h-3 w-3" />
                      {t('Reconnect')}
                    </Button>
                  ))}
              </>
            );

            return healthy ? (
              <label
                key={conn.externalId}
                htmlFor={`conn-${conn.externalId}`}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-3 transition-colors hover:bg-muted/40',
                  isSelected && 'border-primary/40 bg-primary/5',
                )}
              >
                {row}
              </label>
            ) : (
              <div
                key={conn.externalId}
                className="flex items-center gap-3 px-2 py-3 border-t first:border-t-0"
              >
                {row}
              </div>
            );
          })}
        </RadioGroup>

        <div className="flex items-center gap-3 border-t py-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">
              {t('Use a different account')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('Connect a new {name} account', {
                name: filteredPicker.displayName,
              })}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            disabled={isPieceLoading}
            onClick={handleNewConnection}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('Connect')}
          </Button>
        </div>

        {hasConnections && (
          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              className="gap-1.5"
              disabled={!selectedExternalId}
              onClick={handleContinue}
            >
              <Check className="h-3.5 w-3.5" />
              {t('Continue')}
            </Button>
          </div>
        )}
      </InteractiveCardShell>

      {pieceModel && (
        <CreateOrEditConnectionDialog
          piece={pieceModel}
          open={connectDialogOpen}
          projectId={selectedProjectId}
          setOpen={(open, createdConnection) => {
            setConnectDialogOpen(open);
            if (createdConnection) {
              void queryClient.invalidateQueries({
                queryKey: ['app-connections'],
              });
              const resolvedProjectId =
                selectedProjectId ?? authenticationSession.getProjectId() ?? '';
              resolveWith({
                label: createdConnection.displayName,
                project: '',
                externalId: createdConnection.externalId,
                projectId: resolvedProjectId,
                status: AppConnectionStatus.ACTIVE,
              });
            }
          }}
          reconnectConnection={reconnectConnection}
          isGlobalConnection={
            reconnectConnection?.scope === AppConnectionScope.PLATFORM
          }
        />
      )}
    </>
  );
}

type ConnectionPickerCardProps = {
  picker: ConnectionPickerData;
  onResolve: (payload: Record<string, unknown>) => void;
  onDismiss?: () => void;
  isInteractive?: boolean;
  selectedProjectId?: string | null;
  selectedConnectionLabel?: string;
};
