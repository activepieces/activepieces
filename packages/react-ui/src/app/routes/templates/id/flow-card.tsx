import { Workflow } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { FlowVersionTemplate } from '@activepieces/shared';

type FlowCardProps = {
  flow: FlowVersionTemplate;
  isSelected: boolean;
  singleFlow: boolean;
  onClick: () => void;
};

export const FlowCard = ({
  flow,
  isSelected,
  singleFlow,
  onClick,
}: FlowCardProps) => {
  return (
    <Card
      onClick={onClick}
      variant={singleFlow ? 'default' : 'interactive'}
      isSelected={!singleFlow && isSelected}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 shrink-0" />
            <span className="font-medium text-sm leading-tight truncate">
              {flow.displayName}
            </span>
          </div>
          {flow.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {flow.description}
            </p>
          )}
        </div>

        {flow.trigger && (
          <div className="h-6 px-3 flex items-center rounded-md shrink-0">
            <PieceIconList
              trigger={flow.trigger}
              maxNumberOfIconsToShow={3}
              size="md"
              className="flex gap-1.5"
              circle={false}
              background="white"
              excludeCore={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
