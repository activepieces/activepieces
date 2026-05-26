import { piecesHooks } from '../hooks/pieces-hooks';

type PieceDisplayNameProps = {
  pieceName: string;
  fallback?: string;
};

const PieceDisplayName = ({ pieceName, fallback }: PieceDisplayNameProps) => {
  const { summary } = piecesHooks.usePieceSummary({ name: pieceName });

  return <span>{summary?.displayName || fallback || pieceName}</span>;
};

export { PieceDisplayName };
