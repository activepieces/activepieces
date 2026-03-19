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
      <div
        className={cn(
          'text-left truncate max-w-[120px] 2xl:max-w-[250px]',
          className,
        )}
      >
        {value}
      </div>
    </TextWithTooltip>
  );
};

export { TruncatedColumnTextValue };
