import { t } from 'i18next';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Button } from '@/components/ui/button';
import { piecesHooks } from '@/features/pieces';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';

import { ConnectionRequired } from '../lib/message-parsers';

export function ConnectionRequiredCard({
  connection,
  onSend,
  connectedPieces,
  onPieceConnected,
}: {
  connection: ConnectionRequired;
  onSend?: (text: string) => void;
  connectedPieces?: Set<string>;
  onPieceConnected?: (piece: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const connected = connectedPieces?.has(connection.piece) ?? false;
  const shortName = connection.piece.replace(/[^a-z0-9-]/gi, '');
  const pieceName = connection.piece.startsWith('@activepieces/')
    ? connection.piece
    : `@activepieces/piece-${shortName}`;
  const { pieceModel, isLoading } = piecesHooks.usePiece({ name: pieceName });

  return (
    <>
      <motion.div
        className="rounded-xl border bg-background shadow-sm overflow-hidden my-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
      >
        <div className="p-4 flex items-center gap-3">
          <PieceIconWithPieceName
            pieceName={pieceName}
            size="sm"
            border={false}
            showTooltip={false}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">
              {connected
                ? t('{name} connected', { name: connection.displayName })
                : t('Connect {name}', { name: connection.displayName })}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {connected
                ? t('Ready to use')
                : t('This automation needs a {name} connection to work', {
                    name: connection.displayName,
                  })}
            </p>
          </div>
          {connected ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="shrink-0 flex items-center justify-center"
            >
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </motion.span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              disabled={isLoading}
              onClick={() => setDialogOpen(true)}
            >
              {t('Connect')}
            </Button>
          )}
        </div>
      </motion.div>
      {pieceModel && (
        <CreateOrEditConnectionDialog
          piece={pieceModel}
          open={dialogOpen}
          setOpen={(open, createdConnection) => {
            setDialogOpen(open);
            if (createdConnection) {
              onPieceConnected?.(connection.piece);
              onSend?.(
                `Done — ${connection.displayName} is connected. [auth externalId: ${createdConnection.externalId}]`,
              );
            }
          }}
          reconnectConnection={null}
          isGlobalConnection={false}
        />
      )}
    </>
  );
}
