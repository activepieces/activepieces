import { typeboxResolver } from '@hookform/resolvers/typebox';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEffectOnce } from 'react-use';

import { ApMarkdown } from '@/components/custom/markdown';
import { AssignConnectionToProjectsControl } from '@/components/ui/assign-global-connection-to-projects';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormError,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { appConnectionsApi } from '@/features/connections/lib/app-connections-api';
import { globalConnectionsApi } from '@/features/connections/lib/global-connections-api';
import { api } from '@/lib/api';
import {
  BasicAuthProperty,
  CustomAuthProperty,
  OAuth2Property,
  OAuth2Props,
  PieceMetadataModel,
  PieceMetadataModelSummary,
  PropertyType,
  SecretTextProperty,
} from '@activepieces/pieces-framework';
import {
  ApErrorParams,
  AppConnectionScope,
  AppConnectionWithoutSensitiveData,
  ErrorCode,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';

import {
  newConnectionUtils,
  ConnectionNameAlreadyExists,
  isConnectionNameUnique,
  NoProjectSelected,
} from '../../features/connections/lib/utils';
import { formUtils } from '../builder/piece-properties/form-utils';

import { BasicAuthConnectionSettings } from './basic-secret-connection-settings';
import { CustomAuthConnectionSettings } from './custom-auth-connection-settings';
import { OAuth2ConnectionSettings } from './oauth2-connection-settings';
import { SecretTextConnectionSettings } from './secret-text-connection-settings';

type ConnectionDialogProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  open: boolean;
  onConnectionCreated: (
    res: Pick<AppConnectionWithoutSensitiveData, 'id' | 'externalId'>,
  ) => void;
  setOpen: (open: boolean) => void;
  reconnectConnection: AppConnectionWithoutSensitiveData | null;
  predefinedConnectionName: string | null;
  isGlobalConnection: boolean;
};

const CreateOrEditConnectionDialog = React.memo(
  ({
    piece,
    open,
    setOpen,
    onConnectionCreated,
    reconnectConnection,
    predefinedConnectionName,
    isGlobalConnection,
  }: ConnectionDialogProps) => {
    const { auth } = piece;

    const formSchema = formUtils.buildConnectionSchema(piece);
    const { externalId, displayName } = newConnectionUtils.getConnectionName(
      piece,
      reconnectConnection,
      predefinedConnectionName,
    );
    const form = useForm<{
      request: UpsertAppConnectionRequestBody & {
        projectIds: string[];
      };
    }>({
      defaultValues: {
        request: {
          ...newConnectionUtils.createDefaultValues(
            piece,
            externalId,
            displayName,
          ),
          projectIds: reconnectConnection?.projectIds ?? [],
        },
      },
      mode: 'onChange',
      reValidateMode: 'onChange',
      resolver: typeboxResolver(formSchema),
    });

    useEffectOnce(() => {
      form.trigger();
    });
    const [errorMessage, setErrorMessage] = useState('');

    const { mutate, isPending } = useMutation({
      mutationFn: async () => {
        setErrorMessage('');
        const formValues = form.getValues().request;
        const isConenctionNameUnique = await isConnectionNameUnique(
          isGlobalConnection,
          formValues.displayName,
        );
        if (
          !isConenctionNameUnique &&
          reconnectConnection?.displayName !== formValues.displayName
        ) {
          throw new ConnectionNameAlreadyExists();
        }
        if (isGlobalConnection) {
          if (formValues.projectIds.length === 0) {
            throw new NoProjectSelected();
          }
          return globalConnectionsApi.upsert({
            ...formValues,
            projectIds: formValues.projectIds,
            scope: AppConnectionScope.PLATFORM,
          });
        }
        return appConnectionsApi.upsert(formValues);
      },
      onSuccess: (connection) => {
        setOpen(false);
        onConnectionCreated({
          id: connection.id,
          externalId: connection.externalId,
        });
        setErrorMessage('');
      },
      onError: (err) => {
        if (err instanceof ConnectionNameAlreadyExists) {
          form.setError('request.displayName', {
            message: err.message,
          });
        } else if (err instanceof NoProjectSelected) {
          form.setError('request.projectIds', {
            message: err.message,
          });
        } else if (api.isError(err)) {
          const apError = err.response?.data as ApErrorParams;
          switch (apError.code) {
            case ErrorCode.INVALID_CLOUD_CLAIM: {
              setErrorMessage(
                t(
                  'Could not claim the authorization code, make sure you have correct settings and try again.',
                ),
              );
              break;
            }
            case ErrorCode.INVALID_APP_CONNECTION: {
              setErrorMessage(
                t('Connection failed with error {msg}', {
                  msg: apError.params.error,
                }),
              );
              break;
            }
            // can happen in embedding sdk connect method
            case ErrorCode.PERMISSION_DENIED: {
              setErrorMessage(
                t(`You don't have the permission to create a connection.`),
              );
              break;
            }
            default: {
              setErrorMessage('Unexpected error, please contact support');
              toast(INTERNAL_ERROR_TOAST);
              console.error(err);
            }
          }
        }
      },
    });
    return (
      <Dialog
        open={open}
        onOpenChange={(open) => setOpen(open)}
        key={piece.name}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-h-[70vh]  min-w-[450px] max-w-[450px] lg:min-w-[650px] lg:max-w-[650px] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {reconnectConnection
                ? t('Reconnect {displayName} Connection', {
                    displayName: reconnectConnection.displayName,
                  })
                : t('Create {displayName} Connection', {
                    displayName: piece.displayName,
                  })}
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-full">
            <ApMarkdown markdown={auth?.description}></ApMarkdown>
            {auth?.description && <Separator className="my-4" />}
            <Form {...form}>
              <form
                onSubmit={() => console.log('submitted')}
                className="flex flex-col gap-4"
              >
                <FormField
                  name="request.displayName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel htmlFor="displayName">
                        {t('Connection Name')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          required
                          id="displayName"
                          type="text"
                          placeholder={t('Connection name')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
                {isGlobalConnection && (
                  <AssignConnectionToProjectsControl
                    control={form.control}
                    name="request.projectIds"
                  />
                )}
                {auth?.type === PropertyType.SECRET_TEXT && (
                  <SecretTextConnectionSettings
                    authProperty={piece.auth as SecretTextProperty<boolean>}
                  />
                )}
                {auth?.type === PropertyType.BASIC_AUTH && (
                  <BasicAuthConnectionSettings
                    authProperty={piece.auth as BasicAuthProperty}
                  />
                )}
                {auth?.type === PropertyType.CUSTOM_AUTH && (
                  <CustomAuthConnectionSettings
                    authProperty={piece.auth as CustomAuthProperty<any>}
                  />
                )}

                {auth?.type === PropertyType.OAUTH2 && (
                  <div className="mt-3.5">
                    <OAuth2ConnectionSettings
                      authProperty={piece.auth as OAuth2Property<OAuth2Props>}
                      piece={piece}
                      reconnectConnection={reconnectConnection}
                    />
                  </div>
                )}

                <DialogFooter>
                  <Button
                    onClick={(e) => form.handleSubmit(() => mutate())(e)}
                    className="w-full"
                    loading={isPending}
                    type="submit"
                    disabled={!form.formState.isValid}
                  >
                    {t('Save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </ScrollArea>

          {errorMessage && (
            <FormError
              formMessageId="create-connection-server-error-message"
              className="text-left mt-4"
            >
              {errorMessage}
            </FormError>
          )}
        </DialogContent>
      </Dialog>
    );
  },
);

CreateOrEditConnectionDialog.displayName = 'CreateOrEditConnectionDialog';
export { CreateOrEditConnectionDialog };
