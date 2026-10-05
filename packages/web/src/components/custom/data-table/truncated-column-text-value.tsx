import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { cn } from '@/lib/utils';

const TruncatedColumnTextValue = ({
  value,
  className,
}: {
  value: string;
  className?: string;
}) => {
  return (
    <TextWithTooltip tooltipMessage={value}>
      <div className={cn('min-w-0 truncate text-left', className)}>{value}</div>
    </TextWithTooltip>
  );
};

export { TruncatedColumnTextValue };
