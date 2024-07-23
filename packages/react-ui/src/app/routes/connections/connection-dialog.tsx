import React, { useState } from 'react';

import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/seperator';
import { PieceMetadataModelSummary, PropertyType, SecretTextProperty } from '@activepieces/pieces-framework';
import { SecretTextConnectionSettings } from './secret-text-connection-settings';
import { AppConnection, UpsertAppConnectionRequestBody } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';

type ConnectionDialogProps = {
  piece: PieceMetadataModelSummary
  connectionName?: string
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ConnectionDialog = React.memo(
  ({ piece, open, setOpen, connectionName }: ConnectionDialogProps) => {
    const { auth } = piece;

    const [disabledButton, setDisabledButton] = useState(true);
    const [request, setRequest] = useState<UpsertAppConnectionRequestBody | null>(null);
    const { mutate, isPending } = useMutation<
      AppConnection | null,
      Error,
      void
    >({
      mutationFn: async (req) => {
        console.log(req);
        return null;
      },
      onSuccess: (value) => {
        console.log(value);
      },
      onError: (error) => {
        console.log(error);
      },
    });


    return (
      <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create {piece.displayName} Connection</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <ApMarkdown markdown={auth?.description}></ApMarkdown>
          {auth?.description && <Separator className="my-4" />}

          {auth?.type === PropertyType.SECRET_TEXT
            && <SecretTextConnectionSettings
              authProperty={piece.auth as SecretTextProperty<boolean>}
              connectionName={connectionName}
              pieceName={piece.name}
              onChange={(req, valid) => {
                setRequest(req);
                setDisabledButton(!valid);
              }} />}
          <DialogFooter>
            <Button onClick={() => mutate()} className="w-full" disabled={disabledButton} loading={isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

ConnectionDialog.displayName = 'ConnectionDialog';
export { ConnectionDialog };
