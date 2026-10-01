import { Card, CardContent } from '@/components/ui/card';
import { PieceIconWithPieceName, piecesHooks } from '@/features/pieces';
import { formatUtils } from '@/lib/format-utils';

type PieceCardProps = {
  pieceName: string;
};

export const PieceCard = ({ pieceName }: PieceCardProps) => {
  const { summary } = piecesHooks.usePieceSummary({ name: pieceName });

  return (
    <Card className="py-2">
      <CardContent className="w-[165px] flex-row items-center gap-2 px-2">
        <PieceIconWithPieceName pieceName={pieceName} size="md" />
        <span className="truncate text-sm font-medium">
          {summary?.displayName ||
            formatUtils.convertEnumToHumanReadable(pieceName)}
        </span>
      </CardContent>
    </Card>
  );
};
