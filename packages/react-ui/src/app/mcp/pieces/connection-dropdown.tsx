import { t } from 'i18next';
import React, { useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Label } from '@/components/ui/label';
import { appConnectionsHooks } from '@/features/connections/lib/app-connections-hooks';
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
  }: ConnectionDropdownProps) => {
    const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);

    const {
      data: connections,
      isLoading: connectionsLoading,
      refetch: refetchConnections,
      isRefetching: isRefetchingConnections,
    } = appConnectionsHooks.useConnections({
      pieceName: piece?.name || '',
      cursor: undefined,
      limit: 1000,
    });

    const pieceHasAuth = !isNil(piece?.auth);

    if (!piece || !pieceHasAuth) {
      return null;
    }

    const connectionOptions =
      connections?.map((connection) => ({
        label: connection.displayName,
        value: connection.externalId,
      })) ?? [];

    const connectionOptionsWithNewConnectionOption = [
      { label: t('+ New Connection'), value: '' },
      ...connectionOptions,
    ];

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
            onChange={(selectedValue) => {
              if (selectedValue) {
                onChange(selectedValue as string);
              } else {
                setConnectionDialogOpen(true);
              }
            }}
            options={connectionOptionsWithNewConnectionOption}
            placeholder={placeholder}
            loading={connectionsLoading || isRefetchingConnections}
            disabled={disabled}
            showDeselect={!required && !disabled && value !== null}
          />
        </div>
      </>
    );
  },
);

ConnectionDropdown.displayName = 'ConnectionDropdown';
