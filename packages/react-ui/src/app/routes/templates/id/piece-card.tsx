import { Card, CardContent } from '@/components/ui/card';
import PieceIconWithPieceName from '@/features/pieces/components/piece-icon-from-name';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { formatUtils } from '@/lib/utils';

type PieceCardProps = {
  pieceName: string;
};

export const PieceCard = ({ pieceName }: PieceCardProps) => {
  const { pieceModel } = piecesHooks.usePiece({
    name: pieceName,
  });

  return (
    <Card>
      <CardContent className="p-3 w-[180px] flex items-center gap-3">
        <PieceIconWithPieceName pieceName={pieceName} size="md" />
        <span className="text-sm font-medium">
          {pieceModel?.displayName ||
            formatUtils.convertEnumToHumanReadable(pieceName)}
        </span>
      </CardContent>
    </Card>
  );
};
