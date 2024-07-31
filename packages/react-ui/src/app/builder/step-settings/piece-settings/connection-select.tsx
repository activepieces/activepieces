import { Plus } from 'lucide-react';
import React from 'react';
import { useFormContext } from 'react-hook-form';

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

import { CreateOrEditConnectionDialog } from '../../../../features/connections/components/create-edit-connection-dialog';
import { appConnectionsHooks } from '../../../../features/connections/lib/app-connections-hooks';

type ConnectionSelectProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
};
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
    projectId: authenticationSession.getProjectId(),
  });

  const addBrackets = (str: string) => `{{connections['${str}']}}`;

  return (
    <FormField
      control={form.control}
      name={'settings.input.auth'}
      render={({ field }) => (
        <FormItem>
          <CreateOrEditConnectionDialog
            piece={params.piece}
            onConnectionCreated={(connectionName) => {
              refetch();
              field.onChange(addBrackets(connectionName));
            }}
            open={connectionDialogOpen}
            setOpen={setConnectionDialogOpen}
          ></CreateOrEditConnectionDialog>
          <FormLabel>Connection</FormLabel>
          <Select
            open={selectConnectionOpen}
            onOpenChange={setSelectConnectionOpen}
            defaultValue={field.value as string | undefined}
            onValueChange={field.onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a connection" />
            </SelectTrigger>
            <SelectContent>
              {isLoading && <SelectLoader />}
              {!isLoading && (
                <>
                  <SelectAction
                    onClick={() => {
                      setSelectConnectionOpen(false);
                      setConnectionDialogOpen(true);
                    }}
                  >
                    <span className="flex items-center gap-1 text-primary w-full">
                      <Plus size={16} />
                      Create Connection
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
                </>
              )}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    ></FormField>
  );
});

ConnectionSelect.displayName = 'ConnectionSelect';
export { ConnectionSelect };
