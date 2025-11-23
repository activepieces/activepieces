import { typeboxResolver } from '@hookform/resolvers/typebox';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEffectOnce } from 'react-use';

import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
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
import { SkeletonList } from '@/components/ui/skeleton';
import { AssignConnectionToProjectsControl } from '@/features/connections/components/assign-global-connection-to-projects';
import { appConnectionsMutations } from '@/features/connections/lib/app-connections-hooks';
import { oauthAppsQueries } from '@/features/connections/lib/oauth-apps-hooks';
import { oauth2Utils, PiecesOAuth2AppsMap } from '@/lib/oauth2-utils';
import {
  getAuthPropertyForValue,
  PieceAuthProperty,
  PieceMetadataModel,
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE,
  isNil,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';

import { newConnectionUtils } from '../../features/connections/lib/utils';
import { formUtils } from '../../features/pieces/lib/form-utils';

import { BasicAuthConnectionSettings } from './basic-secret-connection-settings';
import { CustomAuthConnectionSettings } from './custom-auth-connection-settings';
import { MutliAuthList, SelectedAuth } from './multi-auth-list';
import { OAuth2ConnectionSettings } from './oauth2-connection-settings';
import { SecretTextConnectionSettings } from './secret-text-connection-settings';

function CreateOrEditConnectionSection({
  piece,
  reconnectConnection,
  isGlobalConnection,
  externalIdComingFromSdk,
  setOpen,
  selectedAuth,
  onShowSelectAuthButtonClicked,
  showSelectAuthButton,
}: CreateOrEditConnectionSectionProps) {
  const formSchema = formUtils.buildConnectionSchema(selectedAuth.authProperty);
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
        ...newConnectionUtils.createDefaultValues({
          auth: selectedAuth.authProperty,
          suggestedExternalId: externalId,
          suggestedDisplayName: displayName,
          pieceName: piece.name,
        }),
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
          <div className="flex items-center gap-2">
            {reconnectConnection
              ? t('Reconnect {displayName} Connection', {
                  displayName: reconnectConnection.displayName,
                })
              : t('Connect to {displayName}', {
                  displayName: piece.displayName,
                })}
          </div>
        </DialogTitle>
        <DialogDescription></DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form className="flex flex-col gap-3 ">
          <ScrollArea
            className="px-2"
            viewPortClassName="max-h-[calc(70vh-180px)] px-4 mb-1"
          >
            {' '}
            <ApMarkdown
              markdown={selectedAuth.authProperty.description}
            ></ApMarkdown>
            {selectedAuth.authProperty.description && (
              <Separator className="my-4" />
            )}
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
            <div className="mt-3.5">
              <SelectConnectionSettings
                selectedAuth={selectedAuth}
                piece={piece}
              />
            </div>
          </ScrollArea>
          {errorMessage && (
            <FormError
              formMessageId="create-connection-server-error-message"
              className="text-left px-6"
            >
              {errorMessage}
            </FormError>
          )}
          <DialogFooter className="mt-0">
            <div className="mx-5 flex gap-2 w-full">
              {showSelectAuthButton && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={onShowSelectAuthButtonClicked}
                >
                  {t('Try another method')}
                </Button>
              )}
              <div className="grow"></div>
              <DialogClose asChild>
                <Button variant="outline">{t('Cancel')}</Button>
              </DialogClose>
              <Button
                onClick={(e) => form.handleSubmit(() => upsertConnection())(e)}
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
    </>
  );
}
function SelectConnectionSettings({
  selectedAuth,
  piece,
}: SelectConnectionSettingsProps) {
  switch (selectedAuth.authProperty.type) {
    case PropertyType.SECRET_TEXT:
      return (
        <SecretTextConnectionSettings
          authProperty={selectedAuth.authProperty}
        />
      );
    case PropertyType.BASIC_AUTH:
      return (
        <BasicAuthConnectionSettings authProperty={selectedAuth.authProperty} />
      );
    case PropertyType.CUSTOM_AUTH:
      return (
        <CustomAuthConnectionSettings
          authProperty={selectedAuth.authProperty}
        />
      );
    case PropertyType.OAUTH2:
      if (isNil(selectedAuth.grantType) || isNil(selectedAuth.oauth2App)) {
        return <div>Error: Grant type and OAuth2 app are required</div>;
      }
      return (
        <OAuth2ConnectionSettings
          authProperty={selectedAuth.authProperty}
          piece={piece}
          grantType={selectedAuth.grantType}
          oauth2App={selectedAuth.oauth2App}
        />
      );
  }
}

type SelectConnectionSettingsProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  selectedAuth: SelectedAuth;
};
function CreateOrEditConnectionDialogContent(
  props: CreateOrEditConnectionDialogContentProps,
) {
  const piece = props.piece;
  const hasPredefinedOAuth2App = !isNil(
    oauth2Utils.getPredefinedOAuth2App(props.piecesOAuth2AppsMap, piece.name),
  );

  const [selectedAuth, setSelectedAuth] = useState<SelectedAuth | null>(
    getInitialGrantTypeAndOAuth2App(
      getInitiallySelectedAuthInList(piece.auth, props.reconnectConnection),
      props.piecesOAuth2AppsMap,
      piece.name,
    ),
  );
  const [showSelectAuthDialog, setShowSelectAuthDialog] = useState(false);
  if (isNil(piece.auth)) {
    return null;
  }
  const pieceAuth = Array.isArray(piece.auth) ? piece.auth : [piece.auth];
  const hasBothGrantTypes = pieceAuth.some(
    (auth) =>
      auth.type === PropertyType.OAUTH2 &&
      auth.grantType === BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE,
  );
  const hasMultipleAuth =
    Array.isArray(pieceAuth) || hasBothGrantTypes || hasPredefinedOAuth2App;
  return (
    <>
      {!showSelectAuthDialog && selectedAuth && (
        <CreateOrEditConnectionSection
          {...props}
          selectedAuth={selectedAuth}
          onShowSelectAuthButtonClicked={() => setShowSelectAuthDialog(true)}
          showSelectAuthButton={hasMultipleAuth}
        />
      )}
      {showSelectAuthDialog &&
        hasMultipleAuth &&
        piece.auth &&
        selectedAuth && (
          <MutliAuthList
            pieceName={piece.name}
            piecesOAuth2AppsMap={props.piecesOAuth2AppsMap}
            selectedAuth={selectedAuth}
            pieceAuth={Array.isArray(piece.auth) ? piece.auth : [piece.auth]}
            setSelectedAuth={setSelectedAuth}
            confirmSelectedAuth={() => {
              setShowSelectAuthDialog(false);
            }}
          />
        )}
    </>
  );
}

CreateOrEditConnectionDialogContent.displayName =
  'CreateOrEditConnectionDialogContent';

function CreateOrEditConnectionDialog({
  piece,
  open,
  setOpen,
  reconnectConnection,
  isGlobalConnection,
  externalIdComingFromSdk,
}: ConnectionDialogProps) {
  const { data: piecesOAuth2AppsMap, isPending: loadingPiecesOAuth2AppsMap } =
    oauthAppsQueries.usePiecesOAuth2AppsMap();
  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)} key={piece.name}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="max-h-[70vh] px-0  min-w-[450px] max-w-[450px] lg:min-w-[650px] lg:max-w-[650px] overflow-y-auto"
      >
        {loadingPiecesOAuth2AppsMap && hasOAuth2PieceAuth(piece) ? (
          <>
            <DialogHeader className="mb-0">
              <DialogTitle className="px-5">
                <div className="flex items-center gap-2">
                  {reconnectConnection
                    ? t('Reconnect {displayName} Connection', {
                        displayName: reconnectConnection.displayName,
                      })
                    : t('Connect to {displayName}', {
                        displayName: piece.displayName,
                      })}
                </div>
              </DialogTitle>
            </DialogHeader>
            <SkeletonList numberOfItems={4} className="h-7 mt-2"></SkeletonList>
          </>
        ) : (
          <CreateOrEditConnectionDialogContent
            piece={piece}
            piecesOAuth2AppsMap={piecesOAuth2AppsMap ?? {}}
            setOpen={setOpen}
            reconnectConnection={reconnectConnection}
            isGlobalConnection={isGlobalConnection}
            externalIdComingFromSdk={externalIdComingFromSdk}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
function hasOAuth2PieceAuth(
  piece: PieceMetadataModelSummary | PieceMetadataModel,
) {
  if (isNil(piece.auth)) {
    return false;
  }
  if (Array.isArray(piece.auth)) {
    return piece.auth.some((auth) => auth.type === PropertyType.OAUTH2);
  }
  return piece.auth.type === PropertyType.OAUTH2;
}

CreateOrEditConnectionDialog.displayName = 'CreateOrEditConnectionDialog';
export { CreateOrEditConnectionDialog, CreateOrEditConnectionDialogContent };

function getInitiallySelectedAuthInList(
  auth: PieceAuthProperty[] | PieceAuthProperty | undefined,
  reconnectConnection: AppConnectionWithoutSensitiveData | null,
) {
  if (!Array.isArray(auth)) {
    return auth ?? null;
  }
  if (auth.length === 0) {
    return null;
  }
  if (reconnectConnection) {
    return (
      getAuthPropertyForValue({
        authValueType: reconnectConnection.type,
        pieceAuth: auth,
      }) ?? null
    );
  }
  return auth[0] ?? null;
}

function getInitialGrantTypeAndOAuth2App(
  selectedAuth: PieceAuthProperty | null,
  piecesOAuth2AppsMap: PiecesOAuth2AppsMap,
  pieceName: string,
): SelectedAuth | null {
  if (isNil(selectedAuth)) {
    return null;
  }

  if (selectedAuth.type === PropertyType.OAUTH2) {
    return {
      grantType: oauth2Utils.getGrantType(selectedAuth),
      oauth2App: oauth2Utils.getPredefinedOAuth2App(
        piecesOAuth2AppsMap,
        pieceName,
      ) ?? {
        oauth2Type: AppConnectionType.OAUTH2,
        clientId: null,
      },
      authProperty: selectedAuth,
    };
  }
  return {
    grantType: null,
    oauth2App: null,
    authProperty: selectedAuth,
  };
}

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
  piecesOAuth2AppsMap: PiecesOAuth2AppsMap;
  reconnectConnection: AppConnectionWithoutSensitiveData | null;
  isGlobalConnection: boolean;
  externalIdComingFromSdk?: string | null;
  setOpen: (
    open: boolean,
    connection?: AppConnectionWithoutSensitiveData,
  ) => void;
};

type CreateOrEditConnectionSectionProps =
  CreateOrEditConnectionDialogContentProps & {
    onShowSelectAuthButtonClicked: () => void;
    showSelectAuthButton: boolean;
    selectedAuth: SelectedAuth;
  };
