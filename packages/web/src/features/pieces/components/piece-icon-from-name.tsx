import { piecesHooks } from '../hooks/pieces-hooks';

import { PieceIcon } from './piece-icon';

type PieceIconWithPieceNameProps = {
  pieceName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  showTooltip?: boolean;
};

const PieceIconWithPieceName = ({
  pieceName,
  size = 'md',
  border = true,
  showTooltip = true,
}: PieceIconWithPieceNameProps) => {
  const { summary } = piecesHooks.usePieceSummary({ name: pieceName });

  return (
    <PieceIcon
      size={size}
      border={border}
      displayName={summary?.displayName}
      logoUrl={summary?.logoUrl}
      showTooltip={showTooltip}
    />
  );
};

export { PieceIconWithPieceName };
