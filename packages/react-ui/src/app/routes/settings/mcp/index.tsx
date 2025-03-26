import { t } from 'i18next';
import { useState } from 'react';

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
import { Switch } from '../../../../components/ui/switch';
import { appConnectionsHooks } from '../../../../features/connections/lib/app-connections-hooks';
import { PieceIcon } from '../../../../features/pieces/components/piece-icon';
import { piecesHooks } from '../../../../features/pieces/lib/pieces-hook';
import { CopyButton } from '../../../../components/ui/copy-button';
import { Badge } from '../../../../components/ui/badge';

export default function MCPPage() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [addedPieces, setAddedPieces] = useState<Set<string>>(new Set());
  const serverUrl = 'https://your-mcp-server.activepieces.com';

  // Get all pieces
  const { pieces } = piecesHooks.usePieces({});

  // Get all connections
  const { data: connections } = appConnectionsHooks.useConnections({
    cursor: undefined,
    limit: 100,
  });

  // Filter pieces to only show ones with connections
  const connectedPieces = pieces?.filter((piece) =>
    connections?.some((conn) => conn.pieceName === piece.name),
  );

  const togglePiece = (pieceName: string) => {
    setAddedPieces((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pieceName)) {
        newSet.delete(pieceName);
      } else {
        newSet.add(pieceName);
      }
      return newSet;
    });
  };

  const handleSaveChanges = () => {
    // Implement save functionality here
    console.log('Saved changes:', {
      isEnabled,
      serverUrl,
      addedPieces: Array.from(addedPieces),
    });
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 pb-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Model Context Protocol</CardTitle>
          <CardDescription>
            Configure your mcp server settings and manage existing connections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Server URL and Enable/Disable Switch in one row */}
          <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
            {/* Server URL Display */}
            <div className="space-y-2 flex-grow md:w-3/4">
              <Label>{t('Server URL')}</Label>
              <div className="flex items-center space-x-2 p-3 bg-secondary/20 border border-border rounded-md h-[56px]">
                <span className="flex-grow font-mono text-base text-foreground/90">{serverUrl}</span>
                <CopyButton textToCopy={serverUrl} />
              </div>
            </div>

            {/* Enable/Disable Switch */}
            <div className="flex items-center bg-secondary/10 p-4 rounded-md md:w-auto md:min-w-[120px] h-[56px] justify-center">
              <Switch
                id="enableMCP"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
                className="scale-125"
              />
            </div>
          </div>

          <Separator />

          {/* Connected Pieces List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{t('Existing Connections')}</h3>
              <Badge variant="outline">
                {addedPieces.size} {t('Added')}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {connectedPieces?.map((piece) => {
                const isAdded = addedPieces.has(piece.name);
                return (
                  <Card
                    key={piece.name}
                    className="overflow-hidden transition-all duration-200"
                  >
                    <CardContent className="flex flex-row items-start justify-between p-4 gap-3">
                      <div className="flex items-center space-x-3 min-w-0 py-2">
                        <PieceIcon
                          displayName={piece.displayName}
                          logoUrl={piece.logoUrl}
                          size="md"
                          showTooltip={true}
                          circle={true}
                          border={true}
                        />
                        <div className="min-w-0">
                          <h4 className="font-medium truncate">{piece.displayName}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {piece.name}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => togglePiece(piece.name)}
                        className={`shrink-0 min-w-[80px] ${isAdded ? 'text-destructive hover:text-destructive' : 'text-primary hover:text-primary'}`}
                      >
                        {isAdded ? t('Remove') : t('Use')}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
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