import { User2 } from 'lucide-react';

import { ApMarkdown } from '@/components/custom/markdown';
import { formatUtils } from '@/lib/utils';
import { MarkdownVariant } from '@activepieces/shared';

type CommentCardProps = {
  firstName: string;
  lastName: string;
  content: string;
  createdAt: string;
};

function CommentCard({
  firstName,
  lastName,
  content,
  createdAt,
}: CommentCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <User2 className="h-4 w-4" />
        <span className="text-sm">
          {firstName} {lastName}
        </span>
      </div>
      <span className="w-full text-sm bg-muted p-3 rounded-md border b ">
        <ApMarkdown
          markdown={content}
          variant={MarkdownVariant.BORDERLESS}
          className="bg-muted"
        />
      </span>
      <span className="text-xs text-muted-foreground flex justify-end">
        {formatUtils.formatDate(new Date(createdAt))}
      </span>
    </div>
  );
}

export { CommentCard };
