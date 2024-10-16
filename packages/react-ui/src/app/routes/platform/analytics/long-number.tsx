import { TooltipTrigger } from '@radix-ui/react-tooltip';

import { Tooltip, TooltipContent } from '../../../../components/ui/tooltip';
import { formatUtils } from '../../../../lib/utils';

export const LongNumber = ({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) => {
  const numberValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numberValue)) {
    return <span className={className}>0</span>;
  }
  const formatNumber = (num: number) => {
    if (num < 1000) {
      return num.toString(); // Return as is
    } else if (num >= 1000 && num < 1000000) {
      return (num / 1000).toFixed(1) + 'k';
    } else {
      return (num / 1000000).toFixed(1) + 'mil';
    }
  };

  // Format the number
  const formattedValue = formatNumber(numberValue);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={className}>{formattedValue}</span>
      </TooltipTrigger>
      {numberValue > 1000 && (
        <TooltipContent>{formatUtils.formatNumber(numberValue)}</TooltipContent>
      )}
    </Tooltip>
  );
};
LongNumber.displayName = 'LongNumber';
