import { useQuery, useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Plus,
  Hammer,
  Wrench,
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { appConnectionsApi } from '@/features/connections/lib/app-connections-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  ApFlagId,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';

import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import { TableTitle } from '../../../components/ui/table-title';
import { useToast } from '../../../components/ui/use-toast';
import { mcpApi } from '../../../features/mcp/mcp-api';
import { piecesHooks } from '../../../features/pieces/lib/pieces-hook';
import { NewConnectionDialog } from '../../connections/new-connection-dialog';

import { McpConnection } from './mcp-connection';
import { McpInstruction } from './mcp-instruction';
import { McpUrl } from './mcp-url';

export default function MCPPage() {
  const { data: publicUrl } = flagsHooks.useFlag(ApFlagId.PUBLIC_URL);
  const { toast } = useToast();

  const {
    data: mcp,
    refetch: refetchMcp,
    isLoading,
  } = useQuery({
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

  const emptyToolsMessage = (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
      <div className="rounded-full bg-muted/50 p-3 mb-3">
        <Wrench className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <p className="font-medium text-foreground">{t('No MCP Tools Added')}</p>
      <p className="text-sm mt-1 max-w-md text-center">
        {t(
          "Add tools to enhance your AI assistant's capabilities. Your assistant will be able to interact with your Activepieces data and perform actions on your behalf.",
        )}
      </p>
      <NewConnectionDialog
        onConnectionCreated={(connection) => {
          addConnection(connection);
        }}
        isGlobalConnection={false}
      >
        <Button
          variant="default"
          size="sm"
          className="flex items-center gap-1 mt-4"
        >
          <Plus className="h-4 w-4" />
          {t('Add Your First Tool')}
        </Button>
      </NewConnectionDialog>
    </div>
  );

  const connectionSkeletons = (
    <>
      {Array(3)
        .fill(0)
        .map((_, index) => (
          <McpConnection
            key={`skeleton-${index}`}
            connection={{} as AppConnectionWithoutSensitiveData}
            isUpdating={false}
            pieceInfo={{ displayName: '', logoUrl: '' }}
            onDelete={() => {}}
            isLoading={true}
          />
        ))}
    </>
  );

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8 pb-12">
      <div className="w-full space-y-8">
        <div className="flex items-center gap-2">
          <TableTitle
            beta={true}
            description={t(
              'Connect to your hosted MCP Server using any MCP client to communicate with pieces',
            )}
          >
            {t('MCP Server')}
          </TableTitle>
        </div>

        <div className="space-y-8">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hammer className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">{t('My Tools')}</h3>
              </div>
              <div className="flex items-center gap-2">
                <NewConnectionDialog
                  onConnectionCreated={(connection) => {
                    addConnection(connection);
                  }}
                  isGlobalConnection={false}
                >
                  <Button
                    id="add-tool-button"
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    {t('Add Tool')}
                  </Button>
                </NewConnectionDialog>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {isLoading
                ? connectionSkeletons
                : !mcp?.connections || mcp.connections.length === 0
                ? emptyToolsMessage
                : mcp.connections.map((connection) => {
                    const pieceInfo = getPieceInfo(connection);
                    return (
                      <McpConnection
                        key={connection.id}
                        connection={connection}
                        isUpdating={removeConnectionMutation.isPending}
                        pieceInfo={pieceInfo}
                        onDelete={removeConnection}
                      />
                    );
                  })}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Server URL and Instructions Section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Server URL Display - Smaller Column */}
            <Card className="p-5 border-border lg:col-span-2">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <McpUrl
                  serverUrl={serverUrl}
                  onRotateToken={handleRotateToken}
                  isRotating={rotateMutation.isPending}
                  hasValidMcp={!!mcp?.id}
                />
              )}
            </Card>

            {/* Instructions section - Larger Column */}
            <Card className="p-5 border-border lg:col-span-3">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <McpInstruction mcpServerUrl={serverUrl} />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
