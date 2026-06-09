import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  AppConnectionScope,
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
  Permission,
  PieceAction,
  PieceTrigger,
  PropertyExecutionType,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Plus,
  Globe,
  Key,
  Cable,
  Check,
  Unplug,
  X,
  LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { AutoFormFieldWrapper } from '@/app/builder/piece-properties/auto-form-field-wrapper';
import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { appConnectionsQueries } from '@/features/connections';
import { piecesHooks } from '@/features/pieces';
import {
  useAuthorization,
  useIsPlatformAdmin,
} from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

function ConnectionSelect(params: ConnectionSelectProps) {
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [selectConnectionOpen, setSelectConnectionOpen] = useState(false);
  const [reconnectConnection, setReconnectConnection] =
    useState<AppConnectionWithoutSensitiveData | null>(null);
  //in case of reconnection we need to use the piece version from the connection
  const { pieceModel: pieceWithCorrectVersion, isLoading: isLoadingPiece } =
    piecesHooks.usePiece({
      name: params.piece.name,
      version: reconnectConnection?.pieceVersion ?? params.piece.version,
    });
  const form = useFormContext<PieceAction | PieceTrigger>();
  const hasPermissionToCreateConnection = useAuthorization().checkAccess(
    Permission.WRITE_APP_CONNECTION,
  );
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
    pieceAuth: params.piece.auth,
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
  const dynamicInputModeToggled =
    form.getValues().settings.propertySettings['auth']?.type ===
    PropertyExecutionType.DYNAMIC;
  const isPlatformAdmin = useIsPlatformAdmin();
  const statusDisplay = selectedConnection
    ? getConnectionStatusDisplay(selectedConnection.status)
    : null;
  const canShowConnectionStatus =
    !!selectedConnection && (!isGlobalConnection || isPlatformAdmin);
  const openReconnectDialog = () => {
    setReconnectConnection(selectedConnection ?? null);
    setSelectConnectionOpen(false);
    setConnectionDialogOpen(true);
  };

  return (
    <FormField
      control={form.control}
      key={form.getValues().settings.input.auth}
      name={'settings.input.auth'}
      render={({ field }) => (
        <>
          {(isLoadingConnections || !pieceWithCorrectVersion) && (
            <div className="flex flex-col gap-2">
              <FormLabel showRequiredIndicator>{t('Connection')}</FormLabel>
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
          {!isLoadingConnections &&
            pieceWithCorrectVersion &&
            params.piece.auth && (
              <AutoFormFieldWrapper
                property={params.piece.auth}
                propertyName="auth"
                field={field}
                disabled={params.disabled}
                inputName="settings.input.auth"
                allowDynamicValues={!params.isTrigger}
                dynamicInputModeToggled={dynamicInputModeToggled}
                isForConnectionSelect={true}
              >
                <CreateOrEditConnectionDialog
                  reconnectConnection={reconnectConnection}
                  isGlobalConnection={isGlobalConnection}
                  piece={pieceWithCorrectVersion}
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
                    {field.value &&
                      !field.disabled &&
                      canShowConnectionStatus &&
                      statusDisplay && (
                        <div className="z-50 absolute right-8 top-1.5 flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground select-none">
                            <statusDisplay.Icon
                              className={cn(
                                'size-3.5 shrink-0',
                                statusDisplay.iconClassName,
                              )}
                            />
                            {statusDisplay.label}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  loading={isLoadingPiece}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openReconnectDialog();
                                  }}
                                  disabled={!hasPermissionToCreateConnection}
                                >
                                  <Cable className="size-3.5" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {!hasPermissionToCreateConnection
                                ? t('Permission needed')
                                : t('Reconnect')}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                    <SelectTrigger className="flex gap-2 items-center">
                      <SelectValue
                        className="truncate grow shrink"
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
                          <div className="truncate grow shrink flex items-center gap-2">
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
                        ) : null}
                      </SelectValue>
                      <div className="grow"></div>
                      {field.value &&
                        !field.disabled &&
                        canShowConnectionStatus &&
                        statusDisplay && (
                          <span
                            aria-hidden
                            className="z-50 opacity-0 pointer-events-none flex items-center gap-1.5"
                          >
                            <span className="flex items-center gap-1 text-xs">
                              <statusDisplay.Icon className="size-3.5 shrink-0" />
                              {statusDisplay.label}
                            </span>
                            <span className="size-6 shrink-0" />
                          </span>
                        )}
                    </SelectTrigger>
                  </div>

                  <SelectContent>
                    <PermissionNeededTooltip
                      hasPermission={hasPermissionToCreateConnection}
                    >
                      <SelectAction
                        onClick={() => {
                          setSelectConnectionOpen(false);
                          setReconnectConnection(null);
                          setConnectionDialogOpen(true);
                        }}
                        disabled={!hasPermissionToCreateConnection}
                      >
                        <span
                          className={cn(
                            'flex items-center gap-1 text-primary w-full',
                            {
                              'text-muted-foreground cursor-not-allowed':
                                !hasPermissionToCreateConnection,
                            },
                          )}
                        >
                          <Plus size={16} />
                          {t('Create Connection')}
                        </span>
                      </SelectAction>
                    </PermissionNeededTooltip>

                    {connections &&
                      connections.data &&
                      connections.data?.map((connection) => {
                        return (
                          <SelectItem
                            value={addBrackets(connection.externalId)}
                            key={connection.externalId}
                          >
                            <div className="flex items-center gap-2">
                              {connection.usingSecretManager && (
                                <Key size={16} className="shrink-0" />
                              )}
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
}

ConnectionSelect.displayName = 'ConnectionSelect';
export { ConnectionSelect };

type ConnectionSelectProps = {
  disabled: boolean;
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  isTrigger: boolean;
};
function addBrackets(str: string) {
  return `{{connections['${str}']}}`;
}
function removeBrackets(str: string | undefined) {
  if (isNil(str)) {
    return undefined;
  }
  return str.replace(
    /\{\{connections\['(.*?)'\]\}\}/g,
    (_, connectionName) => connectionName,
  );
}
function getConnectionStatusDisplay(status: AppConnectionStatus): {
  Icon: LucideIcon;
  iconClassName: string;
  label: string;
} {
  switch (status) {
    case AppConnectionStatus.ACTIVE:
      return {
        Icon: Check,
        iconClassName: 'text-success',
        label: t('Connected'),
      };
    case AppConnectionStatus.ERROR:
      return {
        Icon: X,
        iconClassName: 'text-destructive',
        label: t('Error'),
      };
    case AppConnectionStatus.MISSING:
      return {
        Icon: Unplug,
        iconClassName: 'text-muted-foreground',
        label: t('Missing'),
      };
  }
}
