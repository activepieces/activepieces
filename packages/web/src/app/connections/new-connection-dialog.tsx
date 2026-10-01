import { isNil } from '@activepieces/core-utils';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { Search } from 'lucide-react';
import React, { useState } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { piecesHooks } from '@/features/pieces';

import { CreateOrEditConnectionDialog } from './create-edit-connection-dialog';

type NewConnectionDialogProps = {
  onConnectionCreated: (connection: AppConnectionWithoutSensitiveData) => void;
  children: React.ReactNode;
  isGlobalConnection: boolean;
};

const NewConnectionDialog = React.memo(
  ({
    onConnectionCreated,
    children,
    isGlobalConnection,
  }: NewConnectionDialogProps) => {
    const [dialogTypesOpen, setDialogTypesOpen] = useState(false);
    const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
    const [selectedPiece, setSelectedPiece] = useState<
      PieceMetadataModelSummary | undefined
    >(undefined);
    const { pieces, isLoading } = piecesHooks.usePieces({});
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPieces = pieces?.filter((piece) => {
      return (
        !isNil(piece.auth) &&
        piece.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    const clickPiece = (name: string) => {
      setDialogTypesOpen(false);
      setSelectedPiece(pieces?.find((piece) => piece.name === name));
      setConnectionDialogOpen(true);
    };

    return (
      <>
        {selectedPiece && (
          <CreateOrEditConnectionDialog
            reconnectConnection={null}
            piece={selectedPiece}
            open={connectionDialogOpen}
            isGlobalConnection={isGlobalConnection}
            key={`CreateOrEditConnectionDialog-open-${connectionDialogOpen}`}
            setOpen={(open, connection) => {
              setConnectionDialogOpen(open);
              if (connection) {
                onConnectionCreated(connection);
              }
            }}
          />
        )}
        <Dialog
          open={dialogTypesOpen}
          onOpenChange={(open) => {
            setDialogTypesOpen(open);
            setSearchTerm('');
          }}
        >
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>{t('New connection')}</DialogTitle>
              <DialogDescription>
                {t(
                  'Pick the app to connect. You sign in or paste a key on the next step.',
                )}
              </DialogDescription>
            </DialogHeader>
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                autoFocus
                aria-label={t('Search apps')}
                placeholder={t('Search apps')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-1">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 p-2">
                      <Skeleton className="size-8 rounded-lg" />
                      <div className="flex flex-1 flex-col gap-1.5">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPieces && filteredPieces.length > 0 ? (
                <div className="grid grid-cols-2 gap-1 pr-3">
                  {filteredPieces.map((piece) => (
                    <button
                      type="button"
                      key={piece.name}
                      onClick={() => clickPiece(piece.name)}
                      className="flex min-w-0 items-center gap-3 rounded-xl p-2 text-left outline-hidden transition-colors hover:bg-gray-3 focus-visible:ring-2 focus-visible:ring-accent-8"
                    >
                      <LogoPlate src={piece.logoUrl} alt="" size="sm" />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-gray-12">
                          {piece.displayName}
                        </span>
                        {piece.description && (
                          <span className="truncate text-xs text-gray-11">
                            {piece.description}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <Empty className="h-full">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Search />
                    </EmptyMedia>
                    <EmptyTitle>{t('No apps match your search')}</EmptyTitle>
                    <EmptyDescription>
                      {t('Try a different name.')}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

NewConnectionDialog.displayName = 'NewConnectionDialog';
export { NewConnectionDialog };
