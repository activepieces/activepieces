import { ApAvatar } from '@/components/custom/ap-avatar';
import { isNil } from '@activepieces/shared';

export const NoteFooter = ({ creatorId, isDragging }: NoteFooterProps) => {
  return (
    <div className="flex items-center justify-between gap-2 cursor-grabbing">
      <div className="grow">
        {!isNil(creatorId) && (
          <ApAvatar
            size="xsmall"
            id={creatorId}
            includeName={true}
            hideHover={isDragging}
          />
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
