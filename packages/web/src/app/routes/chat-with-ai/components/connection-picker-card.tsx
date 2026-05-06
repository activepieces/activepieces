import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Button } from '@/components/ui/button';
import { piecesHooks } from '@/features/pieces';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';

import {
  ConnectionPickerData,
  normalizePieceName,
} from '../lib/message-parsers';

function SelectedState({
  pieceName,
  connection,
  displayName,
}: {
  pieceName: string;
  connection: ConnectionPickerData['connections'][number];
  displayName: string;
}) {
  return (
    <motion.div
      className="rounded-xl border bg-background overflow-hidden my-2"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-4 flex items-center gap-3">
        <div className="relative">
          <PieceIconWithPieceName
            pieceName={pieceName}
            size="sm"
            border={false}
            showTooltip={false}
          />
          <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5">
            <Check className="h-2 w-2 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{connection.label}</div>
          <div className="text-xs text-muted-foreground">
            {t('Using this {name} account', { name: displayName })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ConnectionPickerCard({
  picker,
  onSelect,
  isInteractive = true,
}: ConnectionPickerCardProps) {
  const queryClient = useQueryClient();
  const pieceName = normalizePieceName(picker.piece);
  const { pieceModel, isLoading: isPieceLoading } = piecesHooks.usePiece({
    name: pieceName,
  });
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<
    ConnectionPickerData['connections'][number] | null
  >(null);

  if (!isInteractive && picker.connections.length > 0) {
    return (
      <SelectedState
        pieceName={pieceName}
        connection={picker.connections[0]}
        displayName={picker.displayName}
      />
    );
  }

  if (selectedConnection) {
    return (
      <SelectedState
        pieceName={pieceName}
        connection={selectedConnection}
        displayName={picker.displayName}
      />
    );
  }

  return (
    <>
      <motion.div
        className="rounded-xl border bg-background overflow-hidden my-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
      >
        <div className="p-4 pb-3">
          <h3 className="font-semibold text-base">
            {t('Which {name} account should I use?', {
              name: picker.displayName,
            })}
          </h3>
        </div>

        <div className="max-h-64 overflow-auto">
          {picker.connections.map((conn) => (
            <div
              key={conn.externalId}
              className="flex items-center gap-3 px-4 py-3 border-t"
            >
              <PieceIconWithPieceName
                pieceName={pieceName}
                size="sm"
                border={false}
                showTooltip={false}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{conn.label}</div>
                <div className="text-xs text-muted-foreground">
                  {conn.project}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => {
                  setSelectedConnection(conn);
                  onSelect(`Use ${conn.label}`);
                }}
              >
                {t('Use')}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-3 border-t bg-muted/30">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">
              {t('Use a different account')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('Connect a new {name} account', {
                name: picker.displayName,
              })}
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-1.5"
            disabled={isPieceLoading}
            onClick={() => setConnectDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('Connect')}
          </Button>
        </div>
      </motion.div>

      {pieceModel && (
        <CreateOrEditConnectionDialog
          piece={pieceModel}
          open={connectDialogOpen}
          setOpen={(open, createdConnection) => {
            setConnectDialogOpen(open);
            if (createdConnection) {
              void queryClient.invalidateQueries({
                queryKey: ['app-connections'],
              });
              setSelectedConnection({
                label: createdConnection.displayName,
                project: '',
                externalId: createdConnection.externalId,
                projectId: '',
              });
              onSelect(`Connected ${createdConnection.displayName}`);
            }
          }}
          reconnectConnection={null}
          isGlobalConnection={false}
        />
      )}
    </>
  );
}

type ConnectionPickerCardProps = {
  picker: ConnectionPickerData;
  onSelect: (text: string) => void;
  isInteractive?: boolean;
};
