import { t } from 'i18next';
import { Plus, Globe } from 'lucide-react';
import { memo, useState } from 'react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { AutoFormFieldWrapper } from '@/app/builder/piece-properties/auto-form-field-wrapper';
import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import { FormField, FormLabel } from '@/components/ui/form';
import {
  Select,
  SelectAction,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { appConnectionsQueries } from '@/features/connections/lib/app-connections-hooks';
import { authenticationSession } from '@/lib/authentication-session';
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
    data: connections,
    isLoading: isLoadingConnections,
    refetch,
  } = appConnectionsQueries.useAppConnections({
    request: {
      pieceName: params.piece.name,
      projectId: authenticationSession.getProjectId()!,
      limit: 1000,
    },
    extraKeys: [params.piece.name, authenticationSession.getProjectId()!],
    staleTime: 0,
  });

  const selectedConnection = connections?.data?.find(
    (connection) =>
      connection.externalId ===
      removeBrackets(form.getValues().settings.input.auth ?? ''),
  );

  const isGlobalConnection =
    selectedConnection?.scope === AppConnectionScope.PLATFORM;
  return (
    <FormField
      control={form.control}
      key={form.getValues().settings.input.auth}
      name={'settings.input.auth'}
      render={({ field }) => (
        <>
          {isLoadingConnections && (
            <div className="flex flex-col gap-2">
              <FormLabel>
                {t('Connections')} <span className="text-destructive">*</span>
              </FormLabel>
              <SearchableSelect
                options={[]}
                disabled={true}
                loading={isLoadingConnections}
                placeholder={t('Select a connection')}
                value={field.value as React.Key}
                onChange={(value) => field.onChange(value)}
                showDeselect={false}
                onRefresh={() => {}}
                showRefresh={false}
              />
            </div>
          )}
          {!isLoadingConnections && (
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
                isGlobalConnection={isGlobalConnection}
                piece={params.piece}
                key={`CreateOrEditConnectionDialog-open-${connectionDialogOpen}`}
                open={connectionDialogOpen}
                setOpen={(open, connection) => {
                  setConnectionDialogOpen(open);
                  if (connection) {
                    refetch();
                    field.onChange(addBrackets(connection.externalId));
                  }
                }}
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
                      {connections?.data?.find(
                        (connection) =>
                          connection.externalId ===
                            removeBrackets(field.value) &&
                          connection.scope !== AppConnectionScope.PLATFORM,
                      ) && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="z-50 absolute right-8 top-1/2 transform -translate-y-1/2"
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

                  <SelectTrigger className="flex gap-2 items-center h-14">
                    <SelectValue
                      className="truncate flex-grow flex-shrink"
                      placeholder={t('Select a connection')}
                      data-testid="select-connection-value"
                    >
                      {!isNil(field.value) &&
                      !isNil(
                        connections?.data?.find(
                          (connection) =>
                            connection.externalId ===
                            removeBrackets(field.value),
                        ),
                      ) ? (
                        <div className="flex flex-col items-start">
                          <span className="text-xs text-muted-foreground">
                            Connection
                          </span>
                          <div className="truncate flex-grow flex-shrink flex gap-2">
                            {connections?.data?.find(
                              (connection) =>
                                connection.externalId ===
                                removeBrackets(field.value),
                            )?.scope === AppConnectionScope.PLATFORM && (
                              <Globe size={16} className="shrink-0" />
                            )}
                            {
                              connections?.data?.find(
                                (connection) =>
                                  connection.externalId ===
                                  removeBrackets(field.value),
                              )?.displayName
                            }
                          </div>
                        </div>
                      ) : null}
                    </SelectValue>
                    <div className="grow"></div>
                    {field.value &&
                      connections?.data?.find(
                        (connection) =>
                          connection.externalId ===
                            removeBrackets(field.value) &&
                          connection.scope !== AppConnectionScope.PLATFORM,
                      ) && (
                        <span
                          role="button"
                          className="z-50 opacity-0 pointer-events-none"
                        >
                          {t('Reconnect')}
                        </span>
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

                  {connections &&
                    connections.data &&
                    connections.data?.map((connection) => {
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
