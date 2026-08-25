import { Card, CardContent } from '@/components/ui/card';
import { PieceIconWithPieceName, piecesHooks } from '@/features/pieces';
import { formatUtils } from '@/lib/format-utils';

type PieceCardProps = {
  pieceName: string;
};

export const PieceCard = ({ pieceName }: PieceCardProps) => {
  const { summary } = piecesHooks.usePieceSummary({ name: pieceName });

  return (
    <Card>
      <CardContent className="p-2 w-[165px] flex items-center gap-3">
        <PieceIconWithPieceName pieceName={pieceName} size="md" />
        <span className="text-sm font-medium">
          {summary?.displayName ||
            formatUtils.convertEnumToHumanReadable(pieceName)}
        </span>
      </CardContent>
    </Card>
  );
};
