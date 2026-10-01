import { FlowVersionTemplate } from '@activepieces/shared';
import { Workflow } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { PieceIconList } from '@/features/pieces';

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
      <CardContent className="flex-row items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <Workflow className="size-4 shrink-0" />
            <span className="truncate text-sm font-medium">
              {flow.displayName}
            </span>
          </div>
          {flow.description && (
            <p className="line-clamp-2 text-xs text-gray-11">
              {flow.description}
            </p>
          )}
        </div>

        {flow.trigger && (
          <PieceIconList
            trigger={flow.trigger}
            maxNumberOfIconsToShow={3}
            size="md"
            className="flex shrink-0 gap-1.5"
            excludeCore={true}
          />
        )}
      </CardContent>
    </Card>
  );
};
