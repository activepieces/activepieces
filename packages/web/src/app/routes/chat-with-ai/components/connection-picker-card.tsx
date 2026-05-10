import {
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Plus, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Button } from '@/components/ui/button';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { piecesHooks } from '@/features/pieces';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { authenticationSession } from '@/lib/authentication-session';

import {
  ConnectionPickerData,
  normalizePieceName,
} from '../lib/message-parsers';

function isConnectionHealthy(status: AppConnectionStatus): boolean {
  return status === AppConnectionStatus.ACTIVE;
}

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
  connection: ConnectionPickerData['connections'][number];
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
    () => [...new Set(connections.map((c) => c.projectId))].sort().join(','),
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
  onSelect,
  isInteractive = true,
  selectedProjectId,
}: ConnectionPickerCardProps) {
  const queryClient = useQueryClient();
  const pieceName = normalizePieceName(picker.piece);
  const filteredPicker = useMemo(() => {
    if (!selectedProjectId) return picker;
    const filtered = picker.connections.filter(
      (c) => c.projectId === selectedProjectId,
    );
    return { ...picker, connections: filtered };
  }, [picker, selectedProjectId]);
  const { pieceModel, isLoading: isPieceLoading } = piecesHooks.usePiece({
    name: pieceName,
  });
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [reconnectConnection, setReconnectConnection] =
    useState<AppConnectionWithoutSensitiveData | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<
    ConnectionPickerData['connections'][number] | null
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

  if (!isInteractive) {
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
            <div className="text-sm font-semibold">
              {filteredPicker.displayName}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('Connected')}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (selectedConnection) {
    return (
      <SelectedState
        pieceName={pieceName}
        connection={selectedConnection}
        displayName={filteredPicker.displayName}
      />
    );
  }

  return (
    <>
      <motion.div
        className="rounded-xl border bg-background overflow-hidden my-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
      >
        <div className="p-4 pb-3">
          <h3 className="font-semibold text-base">
            {t('Which {name} account should I use?', {
              name: filteredPicker.displayName,
            })}
          </h3>
        </div>

        <div className="max-h-64 overflow-auto">
          {filteredPicker.connections.map((conn) => {
            const status = liveStatuses[conn.externalId] ?? conn.status;
            const healthy = isConnectionHealthy(status);
            return (
              <div
                key={conn.externalId}
                className="flex items-center gap-3 px-4 py-3 border-t"
              >
                <PieceIconWithPieceName
                  pieceName={pieceName}
                  size="sm"
                  border={false}
                  showTooltip={false}
                />
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
                {healthy ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      setSelectedConnection(conn);
                      onSelect(
                        `Use "${conn.label}" from ${conn.project} (${conn.externalId}).`,
                      );
                    }}
                  >
                    {t('Use')}
                  </Button>
                ) : status === AppConnectionStatus.MISSING ? (
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
                    {t('Reconnect & Use')}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 px-4 py-3 border-t bg-muted/30">
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
            className="shrink-0 gap-1.5"
            disabled={isPieceLoading}
            onClick={handleNewConnection}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('Connect')}
          </Button>
        </div>
      </motion.div>

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
              setSelectedConnection({
                label: createdConnection.displayName,
                project: '',
                externalId: createdConnection.externalId,
                projectId: '',
                status: AppConnectionStatus.ACTIVE,
              });
              onSelect(`Connected ${createdConnection.displayName}`);
            }
          }}
          reconnectConnection={reconnectConnection}
          isGlobalConnection={false}
        />
      )}
    </>
  );
}

type ConnectionPickerCardProps = {
  picker: ConnectionPickerData;
  onSelect: (text: string) => void;
  isInteractive?: boolean;
  selectedProjectId?: string | null;
};
