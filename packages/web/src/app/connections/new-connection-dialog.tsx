import { isNil } from '@activepieces/core-utils';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import React, { useState } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { LogoPlate } from '@/components/custom/logo-plate';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { piecesHooks } from '@/features/pieces';
import { AdminControl, adminControl } from '@/lib/admin-control';

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
    const { pieces, isLoading, isError, refetch } = piecesHooks.usePieces({
      skipProjectFilter: isGlobalConnection,
    });
    const [searchTerm, setSearchTerm] = useState('');

    const query = searchTerm.trim().toLowerCase();
    const filteredPieces = (pieces ?? []).filter(
      (piece) =>
        !isNil(piece.auth) && piece.displayName.toLowerCase().includes(query),
    );

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
          ></CreateOrEditConnectionDialog>
        )}
        <Dialog
          open={dialogTypesOpen}
          onOpenChange={(open) => {
            setDialogTypesOpen(open);
            setSearchTerm('');
          }}
        >
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent
            size="lg"
            className="flex h-[85vh] max-h-[680px] flex-col"
          >
            <DialogHeader>
              <DialogTitle>{t('New Connection')}</DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              aria-label={t('Search pieces')}
              placeholder={t('Search pieces')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="min-h-0 grow">
              {isError ? (
                <DataFetchErrorState entity={t('pieces')} onRetry={refetch} />
              ) : isLoading ? (
                <SkeletonList numberOfItems={6} className="h-12 rounded-xl" />
              ) : filteredPieces.length === 0 ? (
                <p className="text-sm text-gray-11">{t('No pieces found')}</p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 p-0.5 sm:grid-cols-2">
                  {filteredPieces.map((piece) => (
                    <li key={piece.name} className="min-w-0">
                      <button
                        type="button"
                        onClick={() => clickPiece(piece.name)}
                        {...adminControl(AdminControl.CONNECTIONS_PIECE_OPEN)}
                        className="flex h-12 w-full min-w-0 items-center gap-3 rounded-xl border px-3 text-left text-sm font-medium text-gray-12 outline-hidden hover:bg-gray-3 focus-visible:ring-2 focus-visible:ring-accent-8"
                      >
                        <LogoPlate size="sm" src={piece.logoUrl} alt="" />
                        <TextWithTooltip tooltipMessage={piece.displayName}>
                          <span className="min-w-0 truncate">
                            {piece.displayName}
                          </span>
                        </TextWithTooltip>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  {t('Close')}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

NewConnectionDialog.displayName = 'NewConnectionDialog';
export { NewConnectionDialog };
