import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatUtils } from '@/lib/utils';

type FormattedDateProps = {
  date: Date;
  className?: string;
};

export const FormattedDate = ({ date, className }: FormattedDateProps) => {
  const formattedDate = formatUtils.formatDate(date);
  const fullDateTime = formatUtils.formatDateWithTime(date);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>{formattedDate}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{fullDateTime}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
