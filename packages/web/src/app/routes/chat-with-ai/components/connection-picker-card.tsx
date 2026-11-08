import {
  AppConnectionScope,
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
  pickDefaultConnectionExternalId,
} from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Plus, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { chatApi } from '@/features/chat/lib/chat-api';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { piecesHooks } from '@/features/pieces';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { authenticationSession } from '@/lib/authentication-session';

import {
  ConnectionPickerData,
  isConnectionHealthy,
  normalizePieceName,
  resolveConnectionCardState,
} from '../lib/message-parsers';
import { useConversationId } from '../lib/use-conversation-id';

import {
  ChatCard,
  ChatCardActions,
  ChatCardBody,
  ChatCardHeader,
  ChatCardTile,
} from './chat-ui/chat-card';
import { ChatLine } from './chat-ui/chat-line';
import { ChatOptionItem, ChatOptionList } from './chat-ui/chat-option';
import { ChatStatusText } from './chat-ui/chat-status';

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
  label,
  displayName,
}: {
  pieceName: string;
  label: string;
  displayName: string;
}) {
  return (
    <ChatLine
      icon={<Check className="size-3.5 text-success-11" />}
      logos={
        <PieceIconWithPieceName
          pieceName={pieceName}
          size="xs"
          border={false}
          showTooltip={false}
        />
      }
      detail={label}
    >
      {t('Using this {name} account', { name: displayName })}
    </ChatLine>
  );
}

function PickerSkeleton() {
  return (
    <ChatCard turn>
      <div className="flex items-center gap-3 py-3 pl-3 pr-4">
        <Skeleton className="size-8 shrink-0 rounded-lg" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <ChatCardBody>
        {[0, 1].map((row) => (
          <div key={row} className="flex items-center gap-3 px-2 py-2">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </ChatCardBody>
    </ChatCard>
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
  const {
    data: fetchedConnections,
    isLoading: isFetchingConnections,
    isError: connectionsFailed,
  } = useQuery({
    queryKey: ['chat-picker-connections', conversationId, pieceName],
    queryFn: async () => {
      const { connections, reconnectOnly } = await chatApi.getPickerConnections(
        {
          conversationId: conversationId!,
          pieceName,
        },
      );
      return {
        reconnectOnly,
        connections: connections.map((c) => ({
          ...c,
          status: c.status as AppConnectionStatus,
        })),
      };
    },
    enabled: shouldFetch,
  });

  const resolvedConnections =
    picker.connections ?? fetchedConnections?.connections ?? [];
  const reconnectOnly = fetchedConnections?.reconnectOnly ?? false;
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
  const [reconnectProjectId, setReconnectProjectId] = useState<string | null>(
    null,
  );
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
    setReconnectProjectId(
      filteredPicker.connections.find((c) => c.externalId === externalId)
        ?.projectId ?? null,
    );
    setReconnectConnection(fullConnection);
    setConnectDialogOpen(true);
  };

  const handleNewConnection = () => {
    setReconnectProjectId(null);
    setReconnectConnection(null);
    setConnectDialogOpen(true);
  };

  if (selectedConnection) {
    return (
      <SelectedState
        pieceName={pieceName}
        label={selectedConnection.label}
        displayName={filteredPicker.displayName}
      />
    );
  }

  if (shouldFetch && isFetchingConnections) {
    return <PickerSkeleton />;
  }

  if (!isInteractive) {
    return (
      <SelectedState
        pieceName={pieceName}
        label={selectedConnectionLabel ?? filteredPicker.displayName}
        displayName={filteredPicker.displayName}
      />
    );
  }

  const hasConnections = filteredPicker.connections.length > 0;
  const { offersOtherAccounts, canContinue, emptyMessage } =
    resolveConnectionCardState({
      reconnectOnly,
      connectionsFailed,
      healthyCount: healthyConnections.length,
    });

  const title = reconnectOnly
    ? t('Reconnect {name}', { name: filteredPicker.displayName })
    : hasConnections
    ? t('Which {name} account should I use?', {
        name: filteredPicker.displayName,
      })
    : t('Connect {name}', { name: filteredPicker.displayName });

  const items: ChatOptionItem[] = filteredPicker.connections.map((conn) => {
    const status = statusOf(conn);
    const healthy = isConnectionHealthy(status);
    const pickable = healthy && !reconnectOnly;
    return {
      id: conn.externalId,
      label: conn.label,
      disabled: !pickable,
      description: healthy ? (
        conn.project
      ) : (
        <>
          {conn.project ? `${conn.project} · ` : ''}
          <span className="text-danger-11">
            {connectionStatusLabel(status)}
          </span>
        </>
      ),
      action: pickable ? undefined : status === AppConnectionStatus.MISSING &&
        !reconnectOnly ? (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={isPieceLoading}
          onClick={handleNewConnection}
        >
          <Plus className="size-3.5" />
          {t('Connect')}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={isPieceLoading || isLoadingStatuses}
          onClick={() => handleReconnect(conn.externalId)}
        >
          <RefreshCw className="size-3.5" />
          {t('Reconnect')}
        </Button>
      ),
    };
  });

  return (
    <>
      <ChatCard turn>
        <ChatCardHeader
          tile={<ChatCardTile kind="app" pieceName={pieceName} />}
          title={title}
          meta={filteredPicker.displayName}
          trailing={<ChatStatusText status="needs-you" />}
        />
        <ChatCardBody>
          {hasConnections ? (
            <ChatOptionList
              items={items}
              mode="radio"
              selected={selectedExternalId ? [selectedExternalId] : []}
              onPick={setUserSelectedExternalId}
              ariaLabel={title}
            />
          ) : (
            <p className="text-sm text-gray-11">
              {emptyMessage === 'loadFailed'
                ? t('Could not load your accounts. Try again in a moment.')
                : emptyMessage === 'pinnedAccountGone'
                ? t(
                    'The {name} account this agent uses is gone. Update the agent tools with a working account.',
                    {
                      name: filteredPicker.displayName,
                    },
                  )
                : t('No {name} account connected yet', {
                    name: filteredPicker.displayName,
                  })}
            </p>
          )}
        </ChatCardBody>
        {(canContinue || offersOtherAccounts || onDismiss) && (
        <ChatCardActions>
          {canContinue && (
            <Button
              size="sm"
              disabled={!selectedExternalId}
              onClick={handleContinue}
            >
              {t('Continue')}
            </Button>
          )}
          {offersOtherAccounts && (
            <Button
              size="sm"
              variant={canContinue ? 'outline' : 'default'}
              className="gap-1.5"
              disabled={isPieceLoading}
              onClick={handleNewConnection}
            >
              <Plus className="size-3.5" />
              {hasConnections
                ? t('Connect another account')
                : t('Connect {name}', { name: filteredPicker.displayName })}
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-11"
              onClick={onDismiss}
            >
              {t('Skip')}
            </Button>
          )}
        </ChatCardActions>
        )}
      </ChatCard>

      {pieceModel && (
        <CreateOrEditConnectionDialog
          piece={pieceModel}
          open={connectDialogOpen}
          projectId={reconnectProjectId ?? selectedProjectId}
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
