import { t } from 'i18next';
import { Plus } from 'lucide-react';
import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';
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
import { PieceAction, PieceTrigger } from '@activepieces/shared';

import { appConnectionsHooks } from '../../../../features/connections/lib/app-connections-hooks';
import { Button } from '@/components/ui/button';

type ConnectionSelectProps = {
  disabled: boolean;
  piece: PieceMetadataModelSummary | PieceMetadataModel;
};
const addBrackets = (str: string) => `{{connections['${str}']}}`;
const removeBrackets = (str: string) =>
  str.replace(
    /\{\{connections\['(.*?)'\]\}\}/g,
    (_, connectionName) => connectionName,
  );
const ConnectionSelect = React.memo((params: ConnectionSelectProps) => {
  const [connectionDialogOpen, setConnectionDialogOpen] = React.useState(false);
  const [selectConnectionOpen, setSelectConnectionOpen] = React.useState(false);

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
  const currentlySelectedConnection = useMemo(() => {
    const connectionName = removeBrackets(
      form.getValues().settings.input.auth ?? '',
    );
    return (
      connectionsPage?.data?.find(
        (connection) => connection.name === connectionName,
      ) ?? null
    );
  }, [connectionsPage?.data, form.getValues().settings.input.auth]);

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
            <FormItem>
              <CreateOrEditConnectionDialog
                reconnectConnection={currentlySelectedConnection}
                piece={params.piece}
                onConnectionCreated={(connectionName) => {
                  refetch();
                  field.onChange(addBrackets(connectionName));
                }}
                open={connectionDialogOpen}
                setOpen={setConnectionDialogOpen}
              ></CreateOrEditConnectionDialog>
              <FormLabel>{t('Connection')}</FormLabel>
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
                        setSelectConnectionOpen(false);
                        setConnectionDialogOpen(true);
                      }}
                    >
                      {t('Reconnect')}
                    </Button>
                  )}

                  <SelectTrigger className="flex gap-2 items-center">
                    <>
                      <SelectValue placeholder={t('Select a connection')} />
                      <div className="grow"></div>
                      {/* Hidden Button to take same space as shown button */}
                      {field.value && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="z-50 hidden "
                        >
                          {t('Reconnect')}
                        </Button>
                      )}
                    </>
                  </SelectTrigger>
                </div>

                <SelectContent>
                  <SelectAction
                    onClick={() => {
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
            </FormItem>
          )}
        </>
      )}
    ></FormField>
  );
});

ConnectionSelect.displayName = 'ConnectionSelect';
export { ConnectionSelect };
