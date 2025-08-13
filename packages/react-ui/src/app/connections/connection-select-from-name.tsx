import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { isNil } from '@activepieces/shared';

import { ConnectionDropdown } from './connection-dropdown';
import { t } from 'i18next';

export interface ConnectionSelectFromNameProps {
  pieceName: string;
  value: string | null;
  onChange: (connectionExternalId: string | null) => void;
}

export const ConnectionSelectFromName = ({
  pieceName,
  value,
  onChange,
}: ConnectionSelectFromNameProps) => {
  const { pieceModel, isLoading } = piecesHooks.usePiece({
    name: pieceName,
  });

  if (isNil(pieceModel) || isLoading) {
    return null;
  }

  return (
    <div className="flex w-full flex-col">
      <ConnectionDropdown
        piece={pieceModel}
        value={value}
        onChange={onChange}
        placeholder={t('Select a connection')}
        showLabel={false}
        required={true}
        showError={false}
      />
    </div>
  );
};
