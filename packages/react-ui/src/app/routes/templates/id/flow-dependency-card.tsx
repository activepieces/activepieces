import { t } from 'i18next';

import { Card, CardContent } from '@/components/ui/card';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { useGradientFromPieces } from '@/lib/utils';
import { FlowVersionTemplate } from '@activepieces/shared';

type FlowDependencyCardProps = {
  flow: FlowVersionTemplate;
};

export const FlowDependencyCard = ({ flow }: FlowDependencyCardProps) => {
  const gradient = useGradientFromPieces(flow.trigger);

  return (
    <Card className="h-full w-full flex flex-col">
      <CardContent className="pt-5 pb-4 px-4 flex flex-col gap-3 flex-1">
        <h3 className="font-bold text-lg leading-tight line-clamp-2">
          {flow.displayName}
        </h3>

        <p className="text-muted-foreground text-sm line-clamp-3">
          {flow.description}
        </p>
      </CardContent>

      <div
        className="h-16 flex items-center px-4 rounded-b-lg transition-all duration-300"
        style={{
          background: gradient || 'transparent',
        }}
      >
        <PieceIconList
          trigger={flow.trigger}
          maxNumberOfIconsToShow={4}
          size="lg"
          className="flex gap-2"
          circle={false}
          background="white"
          shadow={true}
        />
      </div>
    </Card>
  );
};
