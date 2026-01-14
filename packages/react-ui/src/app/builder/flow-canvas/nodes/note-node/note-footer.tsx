import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { userHooks } from '@/hooks/user-hooks';
import { isNil } from '@activepieces/shared';

export const NoteFooter = ({ creatorId }: NoteFooterProps) => {
  const { data: user } = userHooks.useUserById(creatorId ?? null);
  const creator =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="grow">
        {!isNil(creator) && (
          <TextWithTooltip tooltipMessage={creator}>
            <div className="text-xs opacity-65">{creator}</div>
          </TextWithTooltip>
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
