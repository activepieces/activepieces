import { ApAvatar } from '@/components/custom/ap-avatar';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { userHooks } from '@/hooks/user-hooks';
import { isNil } from '@activepieces/shared';

export const NoteFooter = ({ creatorId }: NoteFooterProps) => {


  return (
    <div className="flex items-center justify-between gap-2">
      <div className="grow">
        {!isNil(creatorId) && (
           <ApAvatar size='xsmall' id={creatorId} includeName={true} />
        )}
      </div>
    </div>
  );
};
NoteFooter.displayName = 'NoteFooter';

type NoteFooterProps = {
  id: string;
  isDragging?: boolean;
  creatorId: string | null | undefined;
};
