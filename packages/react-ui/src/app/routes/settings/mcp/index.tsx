import { t } from 'i18next';
import { useEffect, useState } from 'react';

import { Button } from '../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../../../../components/ui/card';
import { Label } from '../../../../components/ui/label';
import { Separator } from '../../../../components/ui/separator';
import { appConnectionsHooks } from '../../../../features/connections/lib/app-connections-hooks';
import { PieceIcon } from '../../../../features/pieces/components/piece-icon';
import { piecesHooks } from '../../../../features/pieces/lib/pieces-hook';
import { CopyButton } from '../../../../components/ui/copy-button';
import { Badge } from '../../../../components/ui/badge';
import { mcpApi } from '../../../../features/mcp/mcp-api';
import { useQuery } from '@tanstack/react-query';
import { NewConnectionDialog } from '../../../connections/new-connection-dialog';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Globe, ExternalLink } from 'lucide-react';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';

export default function MCPPage() {
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<Set<string>>(new Set());
  
  const { data: mcp, isLoading: isMcpLoading } = useQuery({
    queryKey: ['mcp'],
    queryFn: () => {
      return mcpApi.get();
    },
  });

  // Generate the server URL based on the current hostname but mask the sensitive MCP ID
  const serverBaseUrl = window.location.origin + '/v1/mcp/';
  const displayUrl = serverBaseUrl + (mcp?.id ? '********' : '') + '/sse';
  const actualServerUrl = serverBaseUrl + (mcp?.id || '') + '/sse';

  const { pieces } = piecesHooks.usePieces({});

  const { data: connections, refetch: refetchConnections } = appConnectionsHooks.useConnections({
    cursor: undefined,
    limit: 100,
  });

  useEffect(() => {
    if (mcp?.connectionsIds && mcp.connectionsIds.length > 0) {
      setSelectedConnectionIds(new Set(mcp.connectionsIds));
    }
  }, [mcp]);

  const toggleConnection = (connectionId: string) => {
    setSelectedConnectionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(connectionId)) {
        newSet.delete(connectionId);
      } else {
        newSet.add(connectionId);
      }
      return newSet;
    });
  };

  const handleSaveChanges = async () => {
    if (!mcp?.id) return;
    
    const connectionIds = Array.from(selectedConnectionIds);
    await mcpApi.updateConnections(mcp.id, connectionIds);
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Model Context Protocol</CardTitle>
          <CardDescription>
            Configure your MCP server and expose your connections as AI tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {/* Server URL Display - Full width */}
          <div className="space-y-2 w-full">
            <Label>{t('Server URL')}</Label>
            <div className="flex items-center space-x-2 p-3 bg-secondary/20 border border-border rounded-md h-[56px]">
              <span className="flex-grow font-mono text-base text-foreground/90">{displayUrl}</span>
              <CopyButton textToCopy={actualServerUrl} />
            </div>
          </div>

          <Separator />

          {/* Connections List with New Connection Button */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{t('Available Connections')}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedConnectionIds.size} {t('Selected')}
                </Badge>
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
                  const isSelected = selectedConnectionIds.has(connection.id);
                  return (
                    <Card
                      key={connection.id}
                      className={`overflow-hidden transition-all duration-200 ${isSelected ? 'border-primary/30' : ''}`}
                    >
                      <CardContent className="flex flex-row items-start justify-between p-4 gap-3">
                        <div className="flex items-center space-x-3 min-w-0 py-2">
                          <PieceIcon
                            displayName={pieceInfo.displayName}
                            logoUrl={pieceInfo.logoUrl}
                            size="md"
                            showTooltip={true}
                            circle={true}
                            border={true}
                          />
                          <div className="min-w-0">
                            <h4 className="font-medium truncate">{connection.displayName}</h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {connection.pieceName}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => toggleConnection(connection.id)}
                          className={`shrink-0 min-w-[80px] ${isSelected ? 'text-destructive hover:text-destructive' : 'text-primary hover:text-primary'}`}
                        >
                          {isSelected ? t('Remove') : t('Use')}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 pt-4">
          <Button variant="outline">{t('Cancel')}</Button>
          <Button onClick={handleSaveChanges}>{t('Save Changes')}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}