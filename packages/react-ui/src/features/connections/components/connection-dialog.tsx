import { useMutation } from '@tanstack/react-query';
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
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { appConnectionsApi } from '@/features/connections/lib/app-connections-api';
import { api } from '@/lib/api';
import {
  BasicAuthProperty,
  CustomAuthProperty,
  OAuth2Property,
  OAuth2Props,
  PieceMetadataModelSummary,
  PropertyType,
  SecretTextProperty,
} from '@activepieces/pieces-framework';
import {
  ApErrorParams,
  AppConnection,
  ErrorCode,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';

import { SecretTextConnectionSettings } from './secret-text-connection-settings';
import { BasicAuthConnectionSettings } from './basic-secret-connection-settings';
import { OAuth2ConnectionSettings } from './oauth2-connection-settings';
import { CustomAuthConnectionSettings } from './custom-auth-connection-settings';

type ConnectionDialogProps = {
  piece: PieceMetadataModelSummary;
  connectionName?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ConnectionDialog = React.memo(
  ({ piece, open, setOpen, connectionName }: ConnectionDialogProps) => {
    const { auth } = piece;

    const [disabledButton, setDisabledButton] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [request, setRequest] =
      useState<UpsertAppConnectionRequestBody | null>(null);
    const { mutate, isPending } = useMutation<
      AppConnection | null,
      Error,
      void
    >({
      mutationFn: async () => {
        setErrorMessage('');
        return appConnectionsApi.upsert(request!);
      },
      onSuccess: () => {
        setOpen(false);
      },
      onError: (response) => {
        if (api.isError(response)) {
          const apError = response.response?.data as ApErrorParams;
          console.log(apError);
          if (apError.code === ErrorCode.INVALID_CLOUD_CLAIM) {
            setErrorMessage('Could not claim the authorization code, make sure you have correct settings and try again.');
          } else if (apError.code === ErrorCode.INVALID_APP_CONNECTION) {
            setErrorMessage(`Connection failed with error: ${apError.params.error}`);
          }
        } else {
          toast(INTERNAL_ERROR_TOAST);
          console.log(response);
        }
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

          {auth?.type === PropertyType.SECRET_TEXT && (
            <SecretTextConnectionSettings
              authProperty={piece.auth as SecretTextProperty<boolean>}
              connectionName={connectionName}
              pieceName={piece.name}
              onChange={(req, valid) => {
                setRequest(req);
                setDisabledButton(!valid);
              }}
            />
          )}
          {auth?.type === PropertyType.BASIC_AUTH && (
            <BasicAuthConnectionSettings
              authProperty={piece.auth as BasicAuthProperty}
              connectionName={connectionName}
              pieceName={piece.name}
              onChange={(req, valid) => {
                setRequest(req);
                setDisabledButton(!valid);
              }}
            />
          )}
          {auth?.type === PropertyType.OAUTH2 && (
            <OAuth2ConnectionSettings
              authProperty={piece.auth as OAuth2Property<OAuth2Props>}
              connectionName={connectionName}
              piece={piece}
              onChange={(req, valid) => {
                setRequest(req);
                setDisabledButton(!valid);
              }}
            />
          )}
          {auth?.type === PropertyType.CUSTOM_AUTH && (
            <CustomAuthConnectionSettings
              authProperty={piece.auth as CustomAuthProperty<any>}
              connectionName={connectionName}
              pieceName={piece.name}
              onChange={(req, valid) => {
                setRequest(req);
                setDisabledButton(!valid);
              }}
            />
          )}
          <DialogFooter>
            <Button
              onClick={() => mutate()}
              className="w-full"
              disabled={disabledButton}
              loading={isPending}
            >
              Create
            </Button>
          </DialogFooter>
          {errorMessage && (
            <div className="text-left text-sm text-destructive text-sm mt-4">
              {errorMessage}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  },
);

ConnectionDialog.displayName = 'ConnectionDialog';
export { ConnectionDialog };
