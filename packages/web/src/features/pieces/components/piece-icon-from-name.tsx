import { piecesHooks } from '../lib/pieces-hooks';

import { PieceIcon } from './piece-icon';

type PieceIconWithPieceNameProps = {
  pieceName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  circle?: boolean;
  showTooltip?: boolean;
};

const PieceIconWithPieceName = ({
  pieceName,
  size = 'md',
  border = true,
  circle = true,
  showTooltip = true,
}: PieceIconWithPieceNameProps) => {
  const { pieceModel } = piecesHooks.usePiece({
    name: pieceName,
  });

  return (
    <PieceIcon
      circle={circle}
      size={size}
      border={border}
      displayName={pieceModel?.displayName}
      logoUrl={pieceModel?.logoUrl}
      showTooltip={showTooltip}
    />
  );
};

export default PieceIconWithPieceName;
