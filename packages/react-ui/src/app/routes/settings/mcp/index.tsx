import { useQuery, useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Globe } from 'lucide-react';

import { appConnectionsApi } from '@/features/connections/lib/app-connections-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  ApFlagId,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';

import { Button } from '../../../../components/ui/button';
import { Separator } from '../../../../components/ui/separator';
import { useToast } from '../../../../components/ui/use-toast';
import { mcpApi } from '../../../../features/mcp/mcp-api';
import { piecesHooks } from '../../../../features/pieces/lib/pieces-hook';
import { NewConnectionDialog } from '../../../connections/new-connection-dialog';

import { McpConnection } from './mcp-connection';
import { McpInstruction } from './mcp-instruction';
import { McpUrl } from './mcp-url';

export default function MCPPage() {
  const { data: publicUrl } = flagsHooks.useFlag(ApFlagId.PUBLIC_URL);
  const { toast } = useToast();

  const { data: mcp, refetch: refetchMcp } = useQuery({
    queryKey: ['mcp'],
    queryFn: () => {
      return mcpApi.get();
    },
  });

  const serverUrl = publicUrl + 'api/v1/mcp/' + (mcp?.token || '') + '/sse';

  const { pieces } = piecesHooks.usePieces({});

  // Derive state from mcp data directly instead of using useEffect
  const usedConnectionIds = new Set(
    mcp?.connections?.map((connection) => connection.id) || [],
  );

  const updateMcp = useMutation({
    mutationFn: async ({
      mcpId,
      connectionIds,
    }: {
      mcpId: string;
      connectionIds: string[];
    }) => {
      return mcpApi.update({
        id: mcpId,
        connectionsIds: connectionIds,
      });
    },
    onSuccess: () => {
      toast({
        description: t('Tool is added successfully'),
        duration: 3000,
      });
      refetchMcp();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to update connection'),
        duration: 5000,
      });
    },
  });

  const rotateMutation = useMutation({
    mutationFn: async (mcpId: string) => {
      return mcpApi.rotateToken(mcpId);
    },
    onSuccess: () => {
      toast({
        description: t('Token rotated successfully'),
        duration: 3000,
      });
      refetchMcp();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to rotate token'),
        duration: 5000,
      });
    },
  });

  const removeConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      return appConnectionsApi.delete(connectionId);
    },
    onSuccess: () => {
      toast({
        description: t('Connection removed successfully'),
        duration: 3000,
      });
      refetchMcp();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to remove connection'),
        duration: 5000,
      });
    },
  });

  const removeConnection = async (
    connection: AppConnectionWithoutSensitiveData,
  ) => {
    if (!mcp?.id || removeConnectionMutation.isPending) return;

    removeConnectionMutation.mutate(connection.id);
  };

  const handleRotateToken = () => {
    if (!mcp?.id) return;
    rotateMutation.mutate(mcp.id);
  };

  const getPieceInfo = (connection: AppConnectionWithoutSensitiveData) => {
    const piece = pieces?.find((p) => p.name === connection.pieceName);
    return {
      displayName: piece?.displayName || connection.pieceName,
      logoUrl: piece?.logoUrl,
    };
  };

  const addConnection = (connection: AppConnectionWithoutSensitiveData) => {
    if (mcp?.id) {
      const newConnectionIds = new Set(usedConnectionIds);
      newConnectionIds.add(connection.id);
      updateMcp.mutate({
        mcpId: mcp.id,
        connectionIds: Array.from(newConnectionIds),
      });
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 pb-8">
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">
            Model Context Protocol
          </h1>
          <p className="text-muted-foreground">
            Configure your MCP server and expose your connections as AI tools.
          </p>
        </div>

        <div className="space-y-6">
          {/* Server URL Display */}
          <McpUrl
            serverUrl={serverUrl}
            onRotateToken={handleRotateToken}
            isRotating={rotateMutation.isPending}
            hasValidMcp={!!mcp?.id}
          />

          {/* Educational section */}
          <McpInstruction mcpServerUrl={serverUrl} />

          <Separator />

          {/* Tools List with New Connection Button */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{t('Your Tools')}</h3>
              <div className="flex items-center gap-2">
                <NewConnectionDialog
                  onConnectionCreated={(connection) => {
                    addConnection(connection);
                  }}
                  isGlobalConnection={false}
                >
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    {t('New Connection')}
                  </Button>
                </NewConnectionDialog>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {mcp?.connections.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mb-2 opacity-20" />
                  <p>{t('No tools available')}</p>
                  <p className="text-sm">
                    {t('Create a connection to add it as an AI tool')}
                  </p>
                </div>
              ) : (
                mcp?.connections.map((connection) => {
                  const pieceInfo = getPieceInfo(connection);
                  return (
                    <McpConnection
                      key={connection.id}
                      connection={connection}
                      isUpdating={updateMcp.isPending}
                      pieceInfo={pieceInfo}
                      onDelete={removeConnection}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
