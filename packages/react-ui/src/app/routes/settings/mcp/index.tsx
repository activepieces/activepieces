import { t } from 'i18next';
import { Button } from '../../../../components/ui/button';
import { Separator } from '../../../../components/ui/separator';
import { appConnectionsHooks } from '../../../../features/connections/lib/app-connections-hooks';
import { piecesHooks } from '../../../../features/pieces/lib/pieces-hook';
import { mcpApi } from '../../../../features/mcp/mcp-api';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { NewConnectionDialog } from '../../../connections/new-connection-dialog';
import { Globe } from 'lucide-react';
import { ApFlagId, AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { useToast } from '../../../../components/ui/use-toast';
import { McpConnection } from './mcp-connection';
import { flagsHooks } from '@/hooks/flags-hooks';
import { McpUrl } from './mcp-url';
import { McpInstruction } from './mcp-instruction';


export default function MCPPage() {
  const { data: publicUrl } = flagsHooks.useFlag(ApFlagId.PUBLIC_URL)
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: mcp, isLoading: isMcpLoading, refetch: refetchMcp } = useQuery({
    queryKey: ['mcp'],
    queryFn: () => {
      return mcpApi.get();
    },
  });

  const serverUrl = publicUrl + 'api/v1/mcp/' + (mcp?.token || '') + '/sse';

  const { pieces } = piecesHooks.usePieces({});

  const { data: connections, refetch: refetchConnections } = appConnectionsHooks.useConnections({
    cursor: undefined,
    limit: 100,
  });

  // Derive state from mcp data directly instead of using useEffect
  const usedConnectionIds = new Set(mcp?.connections?.map(connection => connection.id) || []);
  const usedPieceNames = new Set(mcp?.connections?.map(connection => connection.pieceName) || []);

  const updateMutation = useMutation({
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
        description: t('Connection updated successfully'),
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['mcp'] });
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
      queryClient.invalidateQueries({ queryKey: ['mcp'] });
      refetchMcp();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to rotate token'),
        duration: 5000,
      });
    }
  });

  const removeConnection = async (connection: AppConnectionWithoutSensitiveData) => {
    if (!mcp?.id || updateMutation.isPending) return;

    const newConnectionIds = new Set(usedConnectionIds);
    newConnectionIds.delete(connection.id);

    // Save changes to the server
    updateMutation.mutate({
      mcpId: mcp.id,
      connectionIds: Array.from(newConnectionIds),
    });
  };

  const handleRotateToken = () => {
    if (!mcp?.id) return;
    rotateMutation.mutate(mcp.id);
  };

  const getPieceInfo = (connection: AppConnectionWithoutSensitiveData) => {
    const piece = pieces?.find(p => p.name === connection.pieceName);
    return {
      displayName: piece?.displayName || connection.pieceName,
      logoUrl: piece?.logoUrl
    };
  };

  // Filter to only show connected tools
  const connectedTools = connections?.filter(connection =>
    usedConnectionIds.has(connection.id)
  ) || [];

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 pb-8">
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Model Context Protocol</h1>
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
                  onConnectionCreated={refetchConnections}
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
              {connectedTools.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mb-2 opacity-20" />
                  <p>{t('No tools available')}</p>
                  <p className="text-sm">{t('Create a connection to add it as an AI tool')}</p>
                </div>
              ) : (
                connectedTools.map((connection) => {
                  const pieceInfo = getPieceInfo(connection);
                  return (
                    <McpConnection
                      key={connection.id}
                      connection={connection}
                      isUpdating={updateMutation.isPending}
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