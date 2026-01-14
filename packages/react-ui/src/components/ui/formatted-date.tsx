import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatUtils } from '@/lib/utils';

type FormattedDateProps = {
  date: Date;
  includeTime?: boolean | undefined;
  className?: string;
};

export const FormattedDate = ({
  date,
  includeTime,
  className,
}: FormattedDateProps) => {
  const formattedDate = formatUtils.formatDate(date);
  const formattedDateWithTime = formatUtils.formatDateWithTime(date, false);
  const fullDateTimeTooltip = formatUtils.formatDateWithTime(date, true);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={className}>
          {includeTime ? formattedDateWithTime : formattedDate}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{fullDateTimeTooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};
