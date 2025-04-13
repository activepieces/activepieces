import { CopyButton } from './copy-button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

const CopyTextTooltip = ({
  text,
  title,
  children,
}: {
  text: string;
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <div className="flex gap-2 items-center">
          {title}: {text || '-'}{' '}
          <CopyButton
            withoutTooltip={true}
            variant="ghost"
            textToCopy={text || ''}
          ></CopyButton>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

CopyTextTooltip.displayName = 'CopyTextTooltip';
export { CopyTextTooltip };
