import { t } from 'i18next';
import { Plus, Globe } from 'lucide-react';
import { memo, useState } from 'react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { AutoFormFieldWrapper } from '@/app/builder/piece-properties/auto-form-field-wrapper';
import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form';
import {
  Select,
  SelectAction,
  SelectContent,
  SelectItem,
  SelectLoader,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  AppConnectionScope,
  AppConnectionWithoutSensitiveData,
  PieceAction,
  PieceTrigger,
  isNil,
} from '@activepieces/shared';

import { appConnectionsHooks } from '../../../../features/connections/lib/app-connections-hooks';

type ConnectionSelectProps = {
  disabled: boolean;
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  isTrigger: boolean;
};
const addBrackets = (str: string) => `{{connections['${str}']}}`;
const removeBrackets = (str: string | undefined) => {
  if (isNil(str)) {
    return undefined;
  }
  return str.replace(
    /\{\{connections\['(.*?)'\]\}\}/g,
    (_, connectionName) => connectionName,
  );
};
const ConnectionSelect = memo((params: ConnectionSelectProps) => {
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [selectConnectionOpen, setSelectConnectionOpen] = useState(false);
  const [reconnectConnection, setReconnectConnection] =
    useState<AppConnectionWithoutSensitiveData | null>(null);
  const form = useFormContext<PieceAction | PieceTrigger>();
  const {
    data: connectionsPage,
    isLoading,
    refetch,
  } = appConnectionsHooks.useConnections({
    pieceName: params.piece.name,
    cursor: undefined,
    limit: 100,
  });

  const selectedConnection = connectionsPage?.find(
    (connection) =>
      connection.externalId ===
      removeBrackets(form.getValues().settings.input.auth ?? ''),
  );

  return (
    <FormField
      control={form.control}
      key={form.getValues().settings.input.auth}
      name={'settings.input.auth'}
      render={({ field }) => (
        <>
          {isLoading && (
            <Select disabled={params.disabled}>
              <SelectContent>
                <SelectLoader />
              </SelectContent>
            </Select>
          )}
          {!isLoading && (
            <AutoFormFieldWrapper
              property={params.piece.auth!}
              propertyName="auth"
              field={field as unknown as ControllerRenderProps}
              disabled={params.disabled}
              hideDescription={true}
              inputName="settings.input.auth"
              allowDynamicValues={!params.isTrigger}
            >
              <CreateOrEditConnectionDialog
                reconnectConnection={reconnectConnection}
                isGlobalConnection={
                  reconnectConnection?.scope === AppConnectionScope.PLATFORM
                }
                predefinedConnectionName={null}
                key={reconnectConnection?.externalId || 'newConnection'}
                piece={params.piece}
                onConnectionCreated={(connection) => {
                  refetch();
                  field.onChange(addBrackets(connection.externalId));
                }}
                open={connectionDialogOpen}
                setOpen={setConnectionDialogOpen}
              ></CreateOrEditConnectionDialog>
              <Select
                open={selectConnectionOpen}
                onOpenChange={setSelectConnectionOpen}
                defaultValue={field.value as string | undefined}
                onValueChange={field.onChange}
                disabled={params.disabled}
              >
                <div className="relative">
                  {field.value && !field.disabled && (
                    <>
                      {connectionsPage?.find(
                        (connection) =>
                          connection.externalId ===
                            removeBrackets(field.value) &&
                          connection.scope !== AppConnectionScope.PLATFORM,
                      ) && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="z-50 absolute right-8 top-2 "
                          onClick={(e) => {
                            e.stopPropagation();
                            setReconnectConnection(selectedConnection ?? null);
                            setSelectConnectionOpen(false);
                            setConnectionDialogOpen(true);
                          }}
                        >
                          {t('Reconnect')}
                        </Button>
                      )}
                    </>
                  )}

                  <SelectTrigger className="flex gap-2 items-center">
                    <SelectValue
                      className="truncate flex-grow flex-shrink"
                      placeholder={t('Select a connection')}
                    >
                      {!isNil(field.value) &&
                      !isNil(
                        connectionsPage?.find(
                          (connection) =>
                            connection.externalId ===
                            removeBrackets(field.value),
                        ),
                      ) ? (
                        <div className="truncate flex-grow flex-shrink flex items-center gap-2">
                          {connectionsPage?.find(
                            (connection) =>
                              connection.externalId ===
                              removeBrackets(field.value),
                          )?.scope === AppConnectionScope.PLATFORM && (
                            <Globe size={16} className="shrink-0" />
                          )}
                          {
                            connectionsPage?.find(
                              (connection) =>
                                connection.externalId ===
                                removeBrackets(field.value),
                            )?.displayName
                          }
                        </div>
                      ) : null}
                    </SelectValue>
                    <div className="grow"></div>
                    {field.value &&
                      connectionsPage?.find(
                        (connection) =>
                          connection.externalId ===
                            removeBrackets(field.value) &&
                          connection.scope !== AppConnectionScope.PLATFORM,
                      ) && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="z-50 opacity-0 pointer-events-none"
                        >
                          {t('Reconnect')}
                        </Button>
                      )}
                  </SelectTrigger>
                </div>

                <SelectContent>
                  <SelectAction
                    onClick={() => {
                      setSelectConnectionOpen(false);
                      setReconnectConnection(null);
                      setConnectionDialogOpen(true);
                    }}
                  >
                    <span className="flex items-center gap-1 text-primary w-full">
                      <Plus size={16} />
                      {t('Create Connection')}
                    </span>
                  </SelectAction>

                  {connectionsPage &&
                    connectionsPage.map((connection) => {
                      return (
                        <SelectItem
                          value={addBrackets(connection.externalId)}
                          key={connection.externalId}
                        >
                          <div className="flex items-center gap-2">
                            {connection.scope ===
                              AppConnectionScope.PLATFORM && (
                              <Globe size={16} className="shrink-0" />
                            )}
                            {connection.displayName}
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </AutoFormFieldWrapper>
          )}
        </>
      )}
    ></FormField>
  );
});

ConnectionSelect.displayName = 'ConnectionSelect';
export { ConnectionSelect };
