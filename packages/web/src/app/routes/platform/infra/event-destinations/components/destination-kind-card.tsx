import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { DestinationKindOption } from '../lib/destination-kinds';

export const DestinationKindCard = ({
  option,
  isSelected,
  trailing,
}: {
  option: DestinationKindOption;
  isSelected: boolean;
  trailing?: React.ReactNode;
}) => {
  const Icon = option.icon;
  return (
    <span className="flex gap-3 text-left">
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md',
          isSelected ? 'bg-primary/10 text-primary' : 'bg-muted',
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{option.title}</span>
          {trailing}
        </span>
        <span className="text-sm font-normal leading-normal text-muted-foreground">
          {option.description}
        </span>
        <Badge
          variant="outline"
          className="rounded-md font-normal text-muted-foreground"
        >
          {option.formatLabel}
        </Badge>
      </span>
    </span>
  );
};
