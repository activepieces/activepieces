import { t } from 'i18next';
import React, { useState } from 'react';

// eslint-disable-next-line import/no-restricted-paths
import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { appConnectionsQueries } from '@/features/connections/lib/app-connections-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';

type ConnectionDropdownProps = {
  piece: PieceMetadataModelSummary;
  value: string | null;
  onChange: (connectionExternalId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  showError?: boolean;
};

function unwrapConnection(input?: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;

  const match = input.match(/^\{\{connections\['([^']+)'\]\}\}$/);
  return match?.[1];
}

export const ConnectionDropdown = React.memo(
  ({
    piece,
    value,
    onChange,
    disabled = false,
    showError = false,
    placeholder = t('Select a connection'),
  }: ConnectionDropdownProps) => {
    const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);

    const {
      data: connections,
      isLoading: connectionsLoading,
      refetch: refetchConnections,
      isRefetching: isRefetchingConnections,
    } = appConnectionsQueries.useAppConnections({
      request: {
        pieceName: piece?.name || '',
        projectId: authenticationSession.getProjectId()!,
        limit: 1000,
      },
      extraKeys: [piece?.name, authenticationSession.getProjectId()!],
      staleTime: 0,
    });

    if (!piece) {
      return null;
    }

    const connectionOptions =
      connections?.data?.map((connection) => ({
        label: connection.displayName,
        value: connection.externalId,
      })) ?? [];

    const connectionOptionsWithNewConnectionOption = [
      { label: t('+ New Connection'), value: '' },
      ...connectionOptions,
    ];

    const handleChange = (selectedValue: string | null) => {
      if (selectedValue) {
        onChange(`{{connections['${selectedValue}']}}`);
      } else {
        setConnectionDialogOpen(true);
      }
    };

    return (
      <>
        <CreateOrEditConnectionDialog
          piece={piece}
          open={connectionDialogOpen}
          setOpen={(open, connection) => {
            setConnectionDialogOpen(open);
            if (connection) {
              onChange(`{{connections['${connection.externalId}']}}`);
              refetchConnections();
            }
          }}
          reconnectConnection={null}
          isGlobalConnection={false}
        />

        <div className="space-y-2">
          <SearchableSelect
            value={unwrapConnection(value)}
            onChange={handleChange}
            options={connectionOptionsWithNewConnectionOption}
            placeholder={placeholder}
            loading={connectionsLoading || isRefetchingConnections}
            disabled={disabled}
            showDeselect={!disabled && value !== null}
            triggerClassName={showError ? 'border-destructive' : undefined}
          />
          {showError && (
            <p className="text-sm font-medium text-destructive break-words">
              {t('Connection is required')}
            </p>
          )}
        </div>
      </>
    );
  },
);

ConnectionDropdown.displayName = 'ConnectionDropdown';
