import { t } from 'i18next';
import { Plus } from 'lucide-react';
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
import { authenticationSession } from '@/lib/authentication-session';
import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
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
    projectId: authenticationSession.getProjectId() ?? '',
  });

  return (
    <FormField
      control={form.control}
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
                key={reconnectConnection?.name || 'newConnection'}
                piece={params.piece}
                onConnectionCreated={(connectionName) => {
                  refetch();
                  field.onChange(addBrackets(connectionName));
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
                    <Button
                      variant="ghost"
                      size="xs"
                      className="z-50 absolute right-8 top-2 "
                      onClick={(e) => {
                        e.stopPropagation();
                        setReconnectConnection(
                          connectionsPage?.data?.find(
                            (connection) =>
                              connection.name ===
                              removeBrackets(
                                form.getValues().settings.input.auth ?? '',
                              ),
                          ) ?? null,
                        );
                        setSelectConnectionOpen(false);
                        setConnectionDialogOpen(true);
                      }}
                    >
                      {t('Reconnect')}
                    </Button>
                  )}

                  <SelectTrigger className="flex gap-2 items-center">
                    <SelectValue
                      className="truncate flex-grow flex-shrink"
                      placeholder={t('Select a connection')}
                    >
                      {!isNil(field.value) &&
                      !isNil(
                        connectionsPage?.data?.find(
                          (connection) =>
                            connection.name === removeBrackets(field.value),
                        ),
                      ) ? (
                        <div className="truncate flex-grow flex-shrink">
                          {removeBrackets(field.value)}
                        </div>
                      ) : null}
                    </SelectValue>
                    <div className="grow"></div>
                    {/* Hidden Button to take same space as shown button */}
                    {field.value && (
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
                      setReconnectConnection(null);
                      setSelectConnectionOpen(false);
                      setConnectionDialogOpen(true);
                    }}
                  >
                    <span className="flex items-center gap-1 text-primary w-full">
                      <Plus size={16} />
                      {t('Create Connection')}
                    </span>
                  </SelectAction>

                  {connectionsPage?.data &&
                    connectionsPage.data.map((connection) => {
                      return (
                        <SelectItem
                          value={addBrackets(connection.name)}
                          key={connection.name}
                        >
                          {connection.name}
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
