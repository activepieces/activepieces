import {
  AppConnectionWithoutSensitiveData,
  AppConnectionScope,
  isNil,
} from '@activepieces/shared';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { t } from 'i18next';
import { Globe, Plus } from 'lucide-react';
import React, { useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectLoader } from '@/components/ui/select';
import { appConnectionsHooks } from '@/features/connections/lib/app-connections-hooks';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';

type McpPieceDialogProps = {
  onPieceSelected: (pieceName: string, connectionId?: string) => void;
  children: React.ReactNode;
};

export const McpPieceDialog = React.memo(
  ({ onPieceSelected, children }: McpPieceDialogProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPiece, setSelectedPiece] = useState<string | undefined>(
      undefined,
    );

    const { pieces, isLoading: piecesLoading } = piecesHooks.usePieces({});
    const { data: connections, isLoading: connectionsLoading } =
      appConnectionsHooks.useConnections({
        pieceName: selectedPiece || '',
        cursor: undefined,
        limit: 1000,
      });

    const filteredPieces = pieces?.filter((piece) => {
      return piece.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const selectedPieceData = pieces?.find(
      (piece) => piece.name === selectedPiece,
    );
    const pieceHasAuth = !isNil(selectedPieceData?.auth);

    const handlePieceSelect = (pieceName: string) => {
      setSelectedPiece(pieceName);
      const piece = pieces?.find((p) => p.name === pieceName);

      // If piece doesn't require auth, complete the selection immediately
      if (isNil(piece?.auth)) {
        onPieceSelected(pieceName);
        setDialogOpen(false);
      }
    };

    const handleConnectionSelect = (connectionId?: string) => {
      if (selectedPiece) {
        onPieceSelected(selectedPiece, connectionId);
        setDialogOpen(false);
      }
    };

    const handleConnectionCreated = (
      connection: AppConnectionWithoutSensitiveData,
    ) => {
      setConnectionDialogOpen(false);
      handleConnectionSelect(connection.id);
    };

    return (
      <>
        {selectedPieceData && (
          <CreateOrEditConnectionDialog
            reconnectConnection={null}
            piece={selectedPieceData}
            open={connectionDialogOpen}
            isGlobalConnection={false}
            key={`CreateOrEditConnectionDialog-open-${connectionDialogOpen}`}
            setOpen={(open, connection) => {
              setConnectionDialogOpen(open);
              if (connection) {
                handleConnectionCreated(connection);
              }
            }}
          />
        )}
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setSearchTerm('');
              setSelectedPiece(undefined);
            }
          }}
        >
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent className="min-w-[700px] max-w-[700px] h-[680px] max-h-[680px] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {selectedPiece && pieceHasAuth
                  ? t('Select Connection')
                  : t('Add Tool')}
              </DialogTitle>
            </DialogHeader>

            {!selectedPiece && (
              <>
                <div className="mb-4">
                  <Input
                    placeholder={t('Search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <ScrollArea className="flex-grow overflow-y-auto">
                  <div className="grid grid-cols-4 gap-4">
                    {(piecesLoading ||
                      (filteredPieces && filteredPieces.length === 0)) && (
                      <div className="text-center">{t('No pieces found')}</div>
                    )}
                    {!piecesLoading &&
                      filteredPieces &&
                      filteredPieces.map((piece, index) => (
                        <div
                          key={index}
                          onClick={() => handlePieceSelect(piece.name)}
                          className="border p-2 h-[150px] w-[150px] flex flex-col items-center justify-center hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-lg"
                        >
                          <img
                            className="w-[40px] h-[40px]"
                            src={piece.logoUrl}
                            alt={piece.displayName}
                          />
                          <div className="mt-2 text-center text-md">
                            {piece.displayName}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </>
            )}

            {selectedPiece && pieceHasAuth && (
              <div className="flex flex-col space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  {t('Select an existing connection or create a new one')}
                </p>

                {connectionsLoading ? (
                  <Select disabled>
                    <SelectContent>
                      <SelectLoader />
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <div className="flex flex-col space-y-4">
                      <Button
                        variant="outline"
                        className="flex justify-start items-center gap-2"
                        onClick={() => setConnectionDialogOpen(true)}
                      >
                        <Plus size={16} />
                        {t('Create New Connection')}
                      </Button>

                      {connections && connections.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">
                            {t('Existing Connections')}
                          </h3>
                          <div className="space-y-1">
                            {connections.map((connection) => (
                              <Button
                                key={connection.id}
                                variant="outline"
                                className="w-full flex justify-start items-center gap-2"
                                onClick={() =>
                                  handleConnectionSelect(connection.id)
                                }
                              >
                                {connection.scope ===
                                  AppConnectionScope.PLATFORM && (
                                  <Globe size={16} className="shrink-0" />
                                )}
                                {connection.displayName}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {selectedPiece && pieceHasAuth && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedPiece(undefined);
                  }}
                >
                  {t('Back')}
                </Button>
              )}
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t('Cancel')}
                </Button>
              </DialogClose>
              {selectedPiece && !pieceHasAuth && (
                <Button
                  type="button"
                  onClick={() => handleConnectionSelect(undefined)}
                >
                  {t('Add')}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

McpPieceDialog.displayName = 'McpPieceDialog';
