import { t } from 'i18next';
import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import { Separator } from '../../../../components/ui/separator';
import { appConnectionsHooks } from '../../../../features/connections/lib/app-connections-hooks';
import { piecesHooks } from '../../../../features/pieces/lib/pieces-hook';
import { CopyButton } from '../../../../components/ui/copy-button';
import { mcpApi } from '../../../../features/mcp/mcp-api';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { NewConnectionDialog } from '../../../connections/new-connection-dialog';
import { InfoCircledIcon, ReloadIcon } from '@radix-ui/react-icons';
import { Globe, KeyRound } from 'lucide-react';
import { ApFlagId, AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { useToast } from '../../../../components/ui/use-toast';
import { McpConnection } from './mcp-connection';
import { flagsHooks } from '@/hooks/flags-hooks';


export default function MCPPage() {
  const { data: publicUrl} = flagsHooks.useFlag(ApFlagId.PUBLIC_URL)
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

  const toggleConnection = async (connection: AppConnectionWithoutSensitiveData) => {
    if (!mcp?.id || updateMutation.isPending) return;

    const newConnectionIds = new Set(usedConnectionIds);
    const pieceName = connection.pieceName;

    if (newConnectionIds.has(connection.id)) {
      newConnectionIds.delete(connection.id);
    } else {
      if (usedPieceNames.has(pieceName)) {
        const existingConnectionId = Array.from(usedConnectionIds).find(id => {
          const conn = connections?.find(c => c.id === id);
          return conn && conn.pieceName === pieceName;
        });

        if (existingConnectionId) {
          newConnectionIds.delete(existingConnectionId);
          const replacedConnection = connections?.find(c => c.id === existingConnectionId);
          const replacedName = replacedConnection?.displayName || '';

          toast({
            description: t(`Replaced '${replacedName}' with '${connection.displayName}'`),
            duration: 3000,
          });
        }
      }

      newConnectionIds.add(connection.id);
    }

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
          {/* Educational section - designed like other Activepieces components */}
          <div className="flex items-start space-x-2 p-4 bg-muted rounded-md text-sm">
            <InfoCircledIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">About Model Context Protocol (MCP)</p>
              <p className="text-muted-foreground">
                MCP is an open protocol that lets AI agents securely connect to external tools and data sources.
                Activepieces implements MCP to expose your connections as AI tools.
              </p>
              <p className="text-muted-foreground mt-1">
                <span className="font-medium">To use with Cursor:</span> Go to Settings → MCP and click "Add new global MCP server".
                Add this URL to your <span className="font-mono text-xs">mcp.json</span> configuration file.
              </p>
            </div>
          </div>

          {/* Server URL Display - Full width with token rotation */}
          <div className="space-y-2 w-full">
            <div className="flex items-center justify-between">
              <Label>{t('Server URL')}</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-primary border-primary hover:bg-primary/10"
                      onClick={handleRotateToken}
                      disabled={rotateMutation.isPending || !mcp?.id}
                    >
                      {rotateMutation.isPending ? (
                        <ReloadIcon className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <KeyRound className="h-3.5 w-3.5 mr-1" />
                      )}
                      {t('Rotate Token')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('Generate a new token for security. This will invalidate the current URL.')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-secondary/20 border border-border rounded-md min-h-[56px]">
              <span className="flex-grow font-mono text-base text-foreground/90 break-all select-all cursor-text">
                {serverUrl}
              </span>
              <CopyButton textToCopy={serverUrl} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('This URL contains a secret token. Only share it with trusted parties.')}
            </p>
          </div>

          <Separator />

          {/* Connections List with New Connection Button */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{t('Your Connections')}</h3>
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
              {!connections || connections.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mb-2 opacity-20" />
                  <p>{t('No connections available')}</p>
                  <p className="text-sm">{t('Create a connection to add it as an AI tool')}</p>
                </div>
              ) : (
                connections.map((connection) => {
                  const pieceInfo = getPieceInfo(connection);
                  const isUsed = usedConnectionIds.has(connection.id);
                  return (
                    <McpConnection
                      key={connection.id}
                      connection={connection}
                      isUsed={isUsed}
                      isUpdating={updateMutation.isPending}
                      pieceInfo={pieceInfo}
                      onToggle={toggleConnection}
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