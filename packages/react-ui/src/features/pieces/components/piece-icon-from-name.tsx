import { piecesHooks } from '../lib/pieces-hook';

import { PieceIcon } from './piece-icon';

type PieceIconWithPieceNameProps = {
  pieceName: string;
};

const PieceIconWithPieceName = ({ pieceName }: PieceIconWithPieceNameProps) => {
  const { pieceModel } = piecesHooks.usePiece({
    name: pieceName,
  });

  return (
    <PieceIcon
      circle={true}
      size={'md'}
      border={true}
      displayName={pieceModel?.displayName}
      logoUrl={pieceModel?.logoUrl}
      showTooltip={true}
    />
  );
};

export default PieceIconWithPieceName;
