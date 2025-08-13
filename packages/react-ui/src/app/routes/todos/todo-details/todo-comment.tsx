import { ApMarkdown } from '@/components/custom/markdown';
import { formatUtils } from '@/lib/utils';
import { MarkdownVariant } from '@activepieces/shared';

import { ApAvatar } from '../../../../components/custom/ap-avatar';

export type ActivityItem = {
  type: 'comment';
  content: string;
  timestamp: Date;
  authorName: string;
  userEmail?: string;
  key?: string;
  id?: string;
};

interface TodoCommentProps {
  comment: ActivityItem;
}

export const TodoComment = ({ comment }: TodoCommentProps) => {
  return (
    <div className="relative mb-4">
      <div className="flex gap-4">
        <div className="flex-shrink-0 self-start">
          <ApAvatar
            size="medium"
            fullName={comment.authorName}
            userEmail={comment.userEmail}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-sm font-bold">{comment.authorName}</div>
            <div className="text-xs text-muted-foreground">
              created {formatUtils.formatDateToAgo(comment.timestamp)}
            </div>
          </div>
          <div className="prose prose-sm max-w-none">
            <ApMarkdown
              markdown={comment.content}
              variant={MarkdownVariant.BORDERLESS}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
