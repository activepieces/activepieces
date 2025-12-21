import { Card, CardContent } from '@/components/ui/card';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { useGradientFromPieces } from '@/lib/utils';
import { FlowVersionTemplate } from '@activepieces/shared';

type FlowCardProps = {
  flow: FlowVersionTemplate;
  isSelected: boolean;
  onClick: () => void;
};

export const FlowCard = ({ flow, isSelected, onClick }: FlowCardProps) => {
  const gradient = useGradientFromPieces(flow?.trigger);

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-accent border-2 border-border'
          : 'hover:bg-accent/50 border-2 border-transparent'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm leading-tight mb-1 truncate">
            {flow.displayName}
          </h4>
          {flow.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {flow.description}
            </p>
          )}
        </div>

        {flow.trigger && (
          <div
            className="h-12 px-3 flex items-center rounded-md transition-all duration-300 shrink-0"
            style={{
              background: gradient || 'transparent',
            }}
          >
            <PieceIconList
              trigger={flow.trigger}
              maxNumberOfIconsToShow={3}
              size="md"
              className="flex gap-1.5"
              circle={false}
              background="white"
              shadow={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

