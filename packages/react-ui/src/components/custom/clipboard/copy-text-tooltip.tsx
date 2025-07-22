import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';

import { CopyButton } from './copy-button';

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
        <div className="flex text-xs gap-2 items-center">
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
