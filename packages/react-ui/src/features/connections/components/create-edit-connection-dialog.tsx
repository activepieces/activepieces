import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

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
  PieceMetadataModelSummary,
  PropertyType,
  SecretTextProperty,
} from '@activepieces/pieces-framework';
import {
  ApErrorParams,
  AppConnection,
  AppConnectionType,
  ErrorCode,
  UpsertAppConnectionRequestBody,
  UpsertBasicAuthRequest,
  UpsertCustomAuthRequest,
  UpsertSecretTextRequest,
} from '@activepieces/shared';

import { SecretTextConnectionSettings } from './secret-text-connection-settings';
import { useForm } from 'react-hook-form';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { appConnectionUtils } from '../lib/app-connections-utils';
import { Form } from '@/components/ui/form';
import { authenticationSession } from '@/lib/authentication-session';
import { Static, Type } from '@sinclair/typebox';
import { BasicAuthConnectionSettings } from './basic-secret-connection-settings';
import { CustomAuthConnectionSettings } from './custom-auth-connection-settings';
import { ScrollArea } from '@radix-ui/react-scroll-area';

type ConnectionDialogProps = {
  piece: PieceMetadataModelSummary;
  connectionName?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CreateOrEditConnectionDialog = React.memo(
  ({ piece, open, setOpen }: ConnectionDialogProps) => {
    const { auth } = piece;

    const formSchema = Type.Object({
      request: UpsertAppConnectionRequestBody,
    })

    const form = useForm<Static<typeof formSchema>>({
      defaultValues: {
        request: createDefaultValues(piece),
      },
      resolver: typeboxResolver(formSchema),
    });

    const formWatch = form.watch();
    useEffect(() => {
      console.log(formWatch)
    }, [formWatch]);
    const [errorMessage, setErrorMessage] = useState('');

    const { mutate, isPending } = useMutation<
      AppConnection | null,
      Error,
      void
    >({
      mutationFn: async () => {
        setErrorMessage('');
        const formValues = form.getValues().request;
        return appConnectionsApi.upsert(formValues);
      },
      onSuccess: () => {
        setOpen(false);
        setErrorMessage('');
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
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-h-[70vh] min-w-[60vw] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Create {piece.displayName} Connection</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-full">
            <ApMarkdown markdown={auth?.description}></ApMarkdown>
            {auth?.description && <Separator className="my-4" />}
            <Form {...form}>
              <div className="flex flex-col gap-4">
                {auth?.type === PropertyType.SECRET_TEXT && (
                  <SecretTextConnectionSettings
                    authProperty={piece.auth as SecretTextProperty<boolean>}
                  />
                )}
                {auth?.type === PropertyType.BASIC_AUTH && (
                  <BasicAuthConnectionSettings authProperty={piece.auth as BasicAuthProperty} />
                )}
                {auth?.type === PropertyType.CUSTOM_AUTH && (
                  <CustomAuthConnectionSettings authProperty={piece.auth as CustomAuthProperty<any>} />
                )}
              </div>
            </Form>
          </ScrollArea>

          <DialogFooter>
            <Button
              onClick={() => mutate()}
              className="w-full"
              disabled={!form.formState.isValid}
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

CreateOrEditConnectionDialog.displayName = 'CreateOrEditConnectionDialog';
export { CreateOrEditConnectionDialog };



function createDefaultValues(piece: PieceMetadataModelSummary): Partial<UpsertSecretTextRequest> | Partial<UpsertBasicAuthRequest> | Partial<UpsertCustomAuthRequest> {
  const suggestedConnectionName = appConnectionUtils.findName(piece.name);
  switch (piece.auth?.type) {
    case PropertyType.SECRET_TEXT:
      return {
        name: suggestedConnectionName,
        pieceName: piece.name,
        projectId: authenticationSession.getProjectId(),
        type: AppConnectionType.SECRET_TEXT,
        value: {
          type: AppConnectionType.SECRET_TEXT,
          secret_text: '',
        },
      };
    case PropertyType.BASIC_AUTH:
      return {
        name: suggestedConnectionName,
        pieceName: piece.name,
        projectId: authenticationSession.getProjectId(),
        type: AppConnectionType.BASIC_AUTH,
        value: {
          type: AppConnectionType.BASIC_AUTH,
          username: '',
          password: '',
        },
      };
    case PropertyType.CUSTOM_AUTH:
      return {
        name: suggestedConnectionName,
        pieceName: piece.name,
        projectId: authenticationSession.getProjectId(),
        type: AppConnectionType.CUSTOM_AUTH,
        value: {
          type: AppConnectionType.CUSTOM_AUTH,
          props: {},
        },
      };
    default:
      throw new Error(`Unsupported property type: ${piece.auth?.type}`);
  }

}