import {
  AppConnectionScope,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { GlobeIcon } from 'lucide-react';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { PieceIconWithPieceName } from '@/features/pieces';

type ConnectionSearchableSelectProps = {
  connections: AppConnectionWithoutSensitiveData[];
  value: string | undefined;
  onChange: (value: string | null) => void;
  placeholder: string;
  loading?: boolean;
  disabled?: boolean;
};

export const ConnectionSearchableSelect = ({
  connections,
  value,
  onChange,
  placeholder,
  loading,
  disabled,
}: ConnectionSearchableSelectProps) => {
  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      loading={loading}
      disabled={disabled}
      placeholder={placeholder}
      options={connections.map((connection) => ({
        label: connection.displayName,
        value: connection.id,
      }))}
      valuesRendering={(selectedValue) => {
        const connection = connections.find((c) => c.id === selectedValue);
        if (!connection) {
          return null;
        }
        return (
          <div className="flex gap-2 items-center">
            <PieceIconWithPieceName
              pieceName={connection.pieceName}
              size="xs"
              border={false}
            />
            {connection.scope === AppConnectionScope.PLATFORM && (
              <GlobeIcon className="w-4 h-4" />
            )}
            <span>{connection.displayName}</span>
          </div>
        );
      }}
    />
  );
};
