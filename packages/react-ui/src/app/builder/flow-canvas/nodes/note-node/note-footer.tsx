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
import { userHooks } from '@/hooks/user-hooks';
import { isNil } from '@activepieces/shared';

export const NoteFooter = ({
  id,
  isDragging,
  creatorId,
}: NoteFooterProps) => {
  const [deleteNote, readonly] = useBuilderStateContext((state) => [
    state.deleteNote,
    state.readonly,
  ]);
  const { data: user } = userHooks.useUserById(creatorId ?? null);
  const creator =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email;
  if (isNil(creator)) {
    return null;
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <TextWithTooltip tooltipMessage={creator}>
        <div className="text-xs opacity-65">{creator}</div>
      </TextWithTooltip>
      {!isDragging && !readonly && (
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

type NoteFooterProps = {
  id: string;
  isDragging?: boolean;
  creatorId: string | null | undefined;
}