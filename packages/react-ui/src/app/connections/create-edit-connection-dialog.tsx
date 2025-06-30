import { typeboxResolver } from '@hookform/resolvers/typebox';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEffectOnce } from 'react-use';

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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AssignConnectionToProjectsControl } from '@/features/connections/components/assign-global-connection-to-projects';
import { appConnectionsMutations } from '@/features/connections/lib/app-connections-hooks';
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
  AppConnectionWithoutSensitiveData,
  isNil,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';

import { newConnectionUtils } from '../../features/connections/lib/utils';
import { formUtils } from '../../features/pieces/lib/form-utils';

import { BasicAuthConnectionSettings } from './basic-secret-connection-settings';
import { CustomAuthConnectionSettings } from './custom-auth-connection-settings';
import { OAuth2ConnectionSettings } from './oauth2-connection-settings';
import { SecretTextConnectionSettings } from './secret-text-connection-settings';

type ConnectionDialogProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  open: boolean;
  setOpen: (
    open: boolean,
    connection?: AppConnectionWithoutSensitiveData,
  ) => void;
  reconnectConnection: AppConnectionWithoutSensitiveData | null;
  isGlobalConnection: boolean;
  externalIdComingFromSdk?: string | null;
};

type CreateOrEditConnectionDialogContentProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  reconnectConnection: AppConnectionWithoutSensitiveData | null;
  isGlobalConnection: boolean;
  externalIdComingFromSdk?: string | null;
  setOpen: (
    open: boolean,
    connection?: AppConnectionWithoutSensitiveData,
  ) => void;
};

const CreateOrEditConnectionDialogContent = React.memo(
  ({
    piece,
    reconnectConnection,
    isGlobalConnection,
    externalIdComingFromSdk,
    setOpen,
  }: CreateOrEditConnectionDialogContentProps) => {
    const { auth } = piece;
    const formSchema = formUtils.buildConnectionSchema(piece);
    const { externalId, displayName } = newConnectionUtils.getConnectionName(
      piece,
      reconnectConnection,
      externalIdComingFromSdk,
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

    const { mutate: upsertConnection, isPending } =
      appConnectionsMutations.useUpsertAppConnection({
        isGlobalConnection,
        reconnectConnection,
        externalIdComingFromSdk,
        setErrorMessage,
        form,
        setOpen,
      });

    return (
      <>
        <DialogHeader className="mb-0">
          <DialogTitle className="px-5">
            {reconnectConnection
              ? t('Reconnect {displayName} Connection', {
                  displayName: reconnectConnection.displayName,
                })
              : t('Connect to {displayName}', {
                  displayName: piece.displayName,
                })}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={() => console.log('submitted')}
            className="flex flex-col gap-4"
          >
            <ScrollArea
              className="px-2"
              viewPortClassName="max-h-[calc(70vh-180px)] px-4"
            >
              {' '}
              <ApMarkdown markdown={auth?.description}></ApMarkdown>
              {auth?.description && <Separator className="my-4" />}
              {(isNil(externalIdComingFromSdk) ||
                externalIdComingFromSdk === '') && (
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
              )}
              {isGlobalConnection && (
                <div className="my-4 flex flex-col gap-4">
                  <AssignConnectionToProjectsControl
                    control={form.control}
                    name="request.projectIds"
                  />
                  {isGlobalConnection && isNil(reconnectConnection) && (
                    <div>
                      <FormField
                        control={form.control}
                        name="request.externalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('External ID')}</FormLabel>
                            <Input {...field} />
                          </FormItem>
                        )}
                      ></FormField>
                    </div>
                  )}
                </div>
              )}
              {auth?.type === PropertyType.SECRET_TEXT && (
                <div className="mt-3.5">
                  <SecretTextConnectionSettings
                    authProperty={piece.auth as SecretTextProperty<boolean>}
                  />
                </div>
              )}
              {auth?.type === PropertyType.BASIC_AUTH && (
                <div className="mt-3.5">
                  <BasicAuthConnectionSettings
                    authProperty={piece.auth as BasicAuthProperty}
                  />
                </div>
              )}
              {auth?.type === PropertyType.CUSTOM_AUTH && (
                <div className="mt-3.5">
                  <CustomAuthConnectionSettings
                    authProperty={piece.auth as CustomAuthProperty<any>}
                  />
                </div>
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
            </ScrollArea>
            <DialogFooter className="mt-0">
              <div className="mx-5 w-full">
                <Button
                  onClick={(e) =>
                    form.handleSubmit(() => upsertConnection())(e)
                  }
                  className="w-full"
                  loading={isPending}
                  type="submit"
                  disabled={!form.formState.isValid}
                >
                  {t('Save')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>

        {errorMessage && (
          <FormError
            formMessageId="create-connection-server-error-message"
            className="text-left mt-4  px-5 "
          >
            {errorMessage}
          </FormError>
        )}
      </>
    );
  },
);

CreateOrEditConnectionDialogContent.displayName =
  'CreateOrEditConnectionDialogContent';

const CreateOrEditConnectionDialog = React.memo(
  ({
    piece,
    open,
    setOpen,
    reconnectConnection,
    isGlobalConnection,
    externalIdComingFromSdk,
  }: ConnectionDialogProps) => {
    return (
      <Dialog
        open={open}
        onOpenChange={(open) => setOpen(open)}
        key={piece.name}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-h-[70vh] px-0  min-w-[450px] max-w-[450px] lg:min-w-[650px] lg:max-w-[650px] overflow-y-auto"
        >
          <CreateOrEditConnectionDialogContent
            piece={piece}
            setOpen={setOpen}
            reconnectConnection={reconnectConnection}
            isGlobalConnection={isGlobalConnection}
            externalIdComingFromSdk={externalIdComingFromSdk}
          />
        </DialogContent>
      </Dialog>
    );
  },
);

CreateOrEditConnectionDialog.displayName = 'CreateOrEditConnectionDialog';
export { CreateOrEditConnectionDialog, CreateOrEditConnectionDialogContent };
