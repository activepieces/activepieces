import {
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Button } from '@/components/ui/button';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { piecesHooks } from '@/features/pieces';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { authenticationSession } from '@/lib/authentication-session';

import { normalizePieceName } from '../lib/message-parsers';

import { InteractiveCardShell } from './interactive-card-shell';

export function ConnectionsRequiredCard({
  connections,
  onResolve,
  onDismiss,
  projectId: selectedProjectId,
  isInteractive = true,
}: {
  connections: ConnectionRequiredData[];
  onResolve?: (payload: Record<string, unknown>) => void;
  onDismiss?: () => void;
  projectId?: string | null;
  isInteractive?: boolean;
}) {
  const queryClient = useQueryClient();
  const [connectedSet, setConnectedSet] = useState<Set<string>>(new Set());
  const [existingConns, setExistingConns] = useState<
    Record<string, AppConnectionWithoutSensitiveData>
  >({});
  const [activeConnection, setActiveConnection] =
    useState<ConnectionRequiredData | null>(null);
  const [isNewConnection, setIsNewConnection] = useState(false);
  const [continued, setContinued] = useState(false);

  const activePieceName = activeConnection
    ? normalizePieceName(activeConnection.piece)
    : null;
  const { pieceModel } = piecesHooks.usePiece({
    name: activePieceName ?? '',
    enabled: !!activePieceName,
  });

  const connectionsKey = useMemo(
    () => connections.map((c) => c.piece).join(','),
    [connections],
  );

  useEffect(() => {
    if (!isInteractive) return;
    const projectId = selectedProjectId ?? authenticationSession.getProjectId();
    if (!projectId) return;
    let cancelled = false;

    void Promise.all(
      connections.map(async (conn) => {
        const pieceName = normalizePieceName(conn.piece);
        const result = await appConnectionsApi.list({
          projectId,
          pieceName,
          limit: 1,
        });
        return { piece: conn.piece, connection: result.data[0] ?? null };
      }),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, AppConnectionWithoutSensitiveData> = {};
      const alreadyActive = new Set<string>();
      for (const { piece, connection } of results) {
        if (connection) {
          map[piece] = connection;
          if (connection.status === AppConnectionStatus.ACTIVE) {
            alreadyActive.add(piece);
          }
        }
      }
      setExistingConns(map);
      if (alreadyActive.size > 0) {
        setConnectedSet(alreadyActive);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [connectionsKey, selectedProjectId, isInteractive]);

  const allConnected = connections.every((c) => connectedSet.has(c.piece));

  if (!isInteractive) {
    return (
      <div className="my-2 flex flex-col gap-2">
        {connections.map((conn) => {
          const pieceName = normalizePieceName(conn.piece);
          return (
            <div
              key={conn.piece}
              className="flex items-center gap-3 rounded-xl border bg-background p-3"
            >
              <div className="relative">
                <PieceIconWithPieceName
                  pieceName={pieceName}
                  size="lg"
                  border={true}
                  showTooltip={false}
                />
                <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{conn.displayName}</div>
                <div className="text-xs text-muted-foreground">
                  {t('Connected')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function openConnectionDialog({
    connection,
    isNew,
  }: {
    connection: ConnectionRequiredData;
    isNew: boolean;
  }) {
    setIsNewConnection(isNew);
    setActiveConnection(connection);
  }

  const title =
    connections.length === 1
      ? t('Connect {name}', { name: connections[0].displayName })
      : t('Connect your apps');

  return (
    <>
      <InteractiveCardShell onDismiss={() => onDismiss?.()} title={title}>
        <div className="flex flex-col gap-2">
          {connections.map((conn, i) => (
            <ConnectionRow
              key={conn.piece}
              index={i}
              connection={conn}
              isConnected={connectedSet.has(conn.piece)}
              existingConn={existingConns[conn.piece] ?? null}
              onConnect={() =>
                openConnectionDialog({ connection: conn, isNew: false })
              }
              onSwitch={() =>
                openConnectionDialog({ connection: conn, isNew: true })
              }
              continued={continued}
            />
          ))}

          {allConnected && (
            <div className="flex items-center rounded-xl border bg-muted/30 px-4 py-3">
              {continued ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  {t('All connected')}
                </div>
              ) : (
                onResolve && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      setContinued(true);
                      const resolvedProjectId =
                        selectedProjectId ??
                        authenticationSession.getProjectId() ??
                        '';
                      const confirmedConnections = connections.map((conn) => {
                        const existing = existingConns[conn.piece];
                        return {
                          piece: conn.piece,
                          displayName: conn.displayName,
                          connectionExternalId: existing?.externalId ?? null,
                          projectId: resolvedProjectId,
                        };
                      });
                      onResolve({
                        message:
                          'All connections are ready, continue building.',
                        connections: confirmedConnections,
                      });
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {t('Continue')}
                  </Button>
                )
              )}
            </div>
          )}
        </div>
      </InteractiveCardShell>

      {pieceModel && activeConnection && (
        <CreateOrEditConnectionDialog
          key={activeConnection.piece}
          piece={pieceModel}
          open={true}
          projectId={selectedProjectId}
          setOpen={(open, createdConnection) => {
            if (!open) {
              if (createdConnection) {
                setExistingConns((prev) => ({
                  ...prev,
                  [activeConnection.piece]: createdConnection,
                }));
                setConnectedSet((prev) => {
                  const next = new Set(prev);
                  next.add(activeConnection.piece);
                  return next;
                });
                void queryClient.invalidateQueries({
                  queryKey: ['app-connections'],
                });
              }
              setActiveConnection(null);
            }
          }}
          reconnectConnection={
            isNewConnection
              ? null
              : existingConns[activeConnection.piece] ?? null
          }
          isGlobalConnection={false}
        />
      )}
    </>
  );
}

function ConnectionRow({
  connection,
  index,
  isConnected,
  existingConn,
  onConnect,
  onSwitch,
  continued,
}: {
  connection: ConnectionRequiredData;
  index: number;
  isConnected: boolean;
  existingConn: AppConnectionWithoutSensitiveData | null;
  onConnect: () => void;
  onSwitch: () => void;
  continued: boolean;
}) {
  const pieceName = normalizePieceName(connection.piece);
  const { isLoading } = piecesHooks.usePiece({ name: pieceName });
  const isReconnect =
    existingConn !== null && existingConn.status !== AppConnectionStatus.ACTIVE;

  return (
    <motion.div
      className="group flex items-center gap-3 rounded-xl border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <div className="relative transition-transform duration-300 ease-out group-hover:scale-105">
        <PieceIconWithPieceName
          pieceName={pieceName}
          size="lg"
          border={true}
          showTooltip={false}
        />
        {isConnected && (
          <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-green-500 p-0.5">
            <Check className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">
          {isConnected && existingConn
            ? existingConn.displayName
            : connection.displayName}
        </div>
        <div className="text-xs text-muted-foreground">
          {isConnected
            ? t('Ready to use')
            : isReconnect
            ? t('Your {name} connection is expired', {
                name: connection.displayName,
              })
            : t('Not connected')}
        </div>
      </div>
      {isConnected ? (
        continued ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="shrink-0 flex items-center justify-center"
          >
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          </motion.span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            onClick={onSwitch}
          >
            <RefreshCw className="h-3 w-3" />
            {t('Switch')}
          </Button>
        )
      ) : (
        <Button
          size="sm"
          variant="default"
          className="gap-1.5 shrink-0"
          disabled={isLoading}
          onClick={onConnect}
        >
          {isReconnect ? t('Reconnect') : t('Connect')}
        </Button>
      )}
    </motion.div>
  );
}

export type ConnectionRequiredData = {
  piece: string;
  displayName: string;
  status?: 'missing' | 'error';
};
