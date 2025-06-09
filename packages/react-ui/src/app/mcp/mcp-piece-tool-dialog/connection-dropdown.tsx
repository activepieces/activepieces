import { t } from 'i18next';
import React, { useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Label } from '@/components/ui/label';
import { appConnectionsQueries } from '@/features/connections/lib/app-connections-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

type ConnectionDropdownProps = {
  piece: PieceMetadataModelSummary;
  value: string | null;
  onChange: (connectionExternalId: string | null) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  showLabel?: boolean;
  required?: boolean;
  showError?: boolean;
};

export const ConnectionDropdown = React.memo(
  ({
    piece,
    value,
    onChange,
    disabled = false,
    label = t('Connection'),
    placeholder = t('Select a connection'),
    showLabel = true,
    required = false,
    showError = false,
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

    const pieceHasAuth = !isNil(piece?.auth);

    const shouldShowError =
      showError && required && pieceHasAuth && value === null;

    if (!piece || !pieceHasAuth) {
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
        onChange(selectedValue as string);
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
              onChange(connection.externalId);
              refetchConnections();
            }
          }}
          reconnectConnection={null}
          isGlobalConnection={false}
        />

        <div className="space-y-2">
          {showLabel && <Label>{label}</Label>}
          <SearchableSelect
            value={value ?? undefined}
            onChange={handleChange}
            options={connectionOptionsWithNewConnectionOption}
            placeholder={placeholder}
            loading={connectionsLoading || isRefetchingConnections}
            disabled={disabled}
            showDeselect={!required && !disabled && value !== null}
            triggerClassName={
              shouldShowError ? 'border-destructive' : undefined
            }
          />
          {shouldShowError && (
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
