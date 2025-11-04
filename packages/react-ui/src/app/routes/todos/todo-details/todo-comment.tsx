import { ApMarkdown } from '@/components/custom/markdown';
import { formatUtils } from '@/lib/utils';
import { MarkdownVariant } from '@activepieces/shared';

import { ApAvatar } from '../../../../components/custom/ap-avatar';

export type ActivityItem = {
  type: 'comment';
  content: string;
  timestamp: Date;
  authorType: 'user' | 'flow';
  authorName: string;
  userEmail?: string;
  flowId?: string;
  key?: string;
  id?: string;
};

interface TodoCommentProps {
  comment: ActivityItem;
  showConnector?: boolean;
}

export const TodoComment = ({ comment, showConnector }: TodoCommentProps) => {
  return (
    <div className="relative">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <ApAvatar
            type={comment.authorType}
            size="medium"
            fullName={comment.authorName}
            userEmail={comment.userEmail}
          />
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold">{comment.authorName}</div>
            <div className="text-xs text-muted-foreground">
              created {formatUtils.formatDateToAgo(comment.timestamp)}
            </div>
          </div>
        </div>
        <div className="relative">
          {showConnector && (
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          )}
          <div className="pl-12">
            <div className="prose prose-sm max-w-none">
              <ApMarkdown
                markdown={comment.content}
                variant={MarkdownVariant.BORDERLESS}
              />
            </div>
          </div>
          {showConnector && <div className="mb-8"></div>}
        </div>
      </div>
    </div>
  );
};
