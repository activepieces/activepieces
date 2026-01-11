import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { Trash } from 'lucide-react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  TooltipTrigger,
  Tooltip,
  TooltipContent,
} from '@/components/ui/tooltip';

export const NoteFooter = ({
  id,
  isDragging,
  creator,
}: {
  id: string;
  isDragging?: boolean;
  creator: string;
}) => {
  const [deleteNote] = useBuilderStateContext((state) => [state.deleteNote]);

  return (
    <div className="flex items-center justify-between gap-2">
      <TextWithTooltip tooltipMessage={creator}>
        <div className=" font-semibold text-xs">{creator}</div>
      </TextWithTooltip>
      {!isDragging && (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-4"
                onClick={() => deleteNote(id)}
              >
                <Trash className="size-4 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Delete')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <DragHandleDots2Icon className="size-4 cursor-grab" />
            </TooltipTrigger>
            <TooltipContent>{t('Drag')}</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
};
NoteFooter.displayName = 'NoteFooter';
