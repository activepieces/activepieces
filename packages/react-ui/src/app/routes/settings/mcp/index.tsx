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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NewConnectionDialog } from '../../../connections/new-connection-dialog';
import { InfoCircledIcon, ReloadIcon } from '@radix-ui/react-icons';
import { Globe, KeyRound } from 'lucide-react';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { useToast } from '../../../../components/ui/use-toast';


export default function MCPPage() {
  const [usedConnectionIds, setUsedConnectionIds] = useState<Set<string>>(new Set());
  const [usedPieceNames, setUsedPieceNames] = useState<Set<string>>(new Set());
  const [isRotating, setIsRotating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  
  const { data: mcp, isLoading: isMcpLoading, refetch: refetchMcp } = useQuery({
    queryKey: ['mcp'],
    queryFn: () => {
      return mcpApi.get();
    },
  });

  // console.log('mcp', mcp);

  // Generate the server URL based on the current hostname
  // TODO: change to the production URL
  const serverBaseUrl = "http://localhost:3000" + '/v1/mcp/';
  const serverUrl = serverBaseUrl + (mcp?.token || '') + '/sse';

  const { pieces } = piecesHooks.usePieces({});

  const { data: connections, refetch: refetchConnections } = appConnectionsHooks.useConnections({
    cursor: undefined,
    limit: 100,
  });

  useEffect(() => {
    if (mcp?.connections) {
      const connectionIds = new Set(mcp.connections.map((connection) => connection.id));
      setUsedConnectionIds(connectionIds);
      
      const pieceNames = new Set(
        mcp.connections.map((connection) => connection.pieceName)
      );

      setUsedPieceNames(pieceNames);
      setHasChanges(false);
    } else {
      setUsedConnectionIds(new Set());
      setUsedPieceNames(new Set());
    }
  }, [mcp]);

  const toggleConnection = (connection: AppConnectionWithoutSensitiveData) => {
    setUsedConnectionIds((prev) => {
      const newSet = new Set(prev);
      const pieceName = connection.pieceName;
      
      if (newSet.has(connection.id)) {
        newSet.delete(connection.id);
        
        setUsedPieceNames(prevPieces => {
          const newPieceNames = new Set(prevPieces);
          newPieceNames.delete(pieceName);
          return newPieceNames;
        });
      } else {
        if (usedPieceNames.has(pieceName)) {
          // Find and remove the existing connection with this piece
          const existingConnectionId = Array.from(prev).find(id => {
            const conn = connections?.find(c => c.id === id);
            return conn && conn.pieceName === pieceName;
          });
          
          if (existingConnectionId) {
            newSet.delete(existingConnectionId);
            
            // Find the name of the replaced connection for better user feedback
            const replacedConnection = connections?.find(c => c.id === existingConnectionId);
            const replacedName = replacedConnection?.displayName || '';
            
            toast({
              description: t(`Replaced '${replacedName}' with '${connection.displayName}'`),
              duration: 3000,
            });
          }
        }
        
        newSet.add(connection.id);
        
        setUsedPieceNames(prevPieces => {
          const newPieceNames = new Set(prevPieces);
          newPieceNames.add(pieceName);
          return newPieceNames;
        });
      }
      
      
      setHasChanges(true);
      return newSet;
    });
  };

  const handleSaveChanges = async () => {
    if (!mcp?.id) return;
    
    setIsSaving(true);
    const connectionIds = Array.from(usedConnectionIds);
    
    try {
      await mcpApi.update({
        id: mcp.id,
        connectionsIds: connectionIds,
      });
      toast({
        description: t('Changes saved successfully'),
        duration: 3000,
      });
      
      // Refresh data from server
      await queryClient.invalidateQueries({ queryKey: ['mcp'] });
      await refetchMcp();
      setHasChanges(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to save changes'),
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    try {
      // Use the cached data immediately for a responsive UI
      if (mcp?.connections) {
        const connectionIds = new Set(mcp.connections.map((connection) => connection.id));
        setUsedConnectionIds(connectionIds);
        
        const pieceNames = new Set(
          mcp.connections.map((connection) => connection.pieceName)
        );
        setUsedPieceNames(pieceNames);
      } else {
        setUsedConnectionIds(new Set());
        setUsedPieceNames(new Set());
      }
      
      // Clear the changes flag immediately
      setHasChanges(false);
      
      // Show toast
      toast({
        description: t('Changes discarded'),
        duration: 3000,
      });
      
      // Refresh in the background without waiting
      queryClient.invalidateQueries({ queryKey: ['mcp'] });
      refetchMcp();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to discard changes'),
        duration: 5000,
      });
    }
  };

  const handleRotateToken = async () => {
    if (!mcp?.id) return;
    
    setIsRotating(true);
    try {
      await mcpApi.rotateToken(mcp.id);
      toast({
        description: t('Token rotated successfully'),
        duration: 3000,
      });
      await queryClient.invalidateQueries({ queryKey: ['mcp'] });
      await refetchMcp();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to rotate token'),
        duration: 5000,
      });
    } finally {
      setIsRotating(false);
    }
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
                      disabled={isRotating || !mcp?.id}
                    >
                      {isRotating ? (
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
                <Badge variant="outline">
                  {usedConnectionIds.size} {t('Used')}
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
                  const isUsed = usedConnectionIds.has(connection.id);
                  return (
                    <Card
                      key={connection.id}
                      className={`overflow-hidden transition-all duration-200 ${
                        isUsed ? 'border-primary/30' : ''
                      }`}
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
                          onClick={() => toggleConnection(connection)}
                          className={`shrink-0 min-w-[80px] ${
                            isUsed ? 'text-destructive hover:text-destructive' : 'text-primary hover:text-primary'
                          }`}
                        >
                          {isUsed ? t('Remove') : t('Use')}
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
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={!hasChanges || isSaving}
          >
            {t('Cancel')}
          </Button>
          <Button 
            onClick={handleSaveChanges}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? t('Saving...') : t('Save Changes')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}