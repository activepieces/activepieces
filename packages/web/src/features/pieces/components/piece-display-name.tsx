import { piecesHooks } from '../lib/pieces-hooks';

type PieceDisplayNameProps = {
  pieceName: string;
  fallback?: string;
};

const PieceDisplayName = ({ pieceName, fallback }: PieceDisplayNameProps) => {
  const { pieceModel } = piecesHooks.usePiece({
    name: pieceName,
  });

  return <span>{pieceModel?.displayName || fallback || pieceName}</span>;
};

export default PieceDisplayName;
