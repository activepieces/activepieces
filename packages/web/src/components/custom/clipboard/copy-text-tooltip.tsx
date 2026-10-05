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
        <div className="flex text-sm gap-2 items-center">
          {title}: {text || '-'}{' '}
          <CopyButton
            withoutTooltip={true}
            variant="ghost"
            className="hover:bg-gray-1/20 hover:text-gray-1"
            textToCopy={text || ''}
          ></CopyButton>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

CopyTextTooltip.displayName = 'CopyTextTooltip';
export { CopyTextTooltip };
