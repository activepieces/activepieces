import { useQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import { todoCommentApi } from '@/features/todos/lib/todos-comment-api';
import { TodoCommentWithUser } from '@activepieces/ee-shared';
import { TodoWithAssignee } from '@activepieces/shared';

import { CommentCard } from './comment-card';

type CommentsProps = {
  task: TodoWithAssignee;
};

function Comments({ task }: CommentsProps) {
  const { data: comments, isLoading: isLoadingComments } = useQuery<
    {
      comments: TodoCommentWithUser[];
    },
    Error
  >({
    queryKey: ['comments', task.id],
    queryFn: async () => {
      const response = await todoCommentApi.list(task.id, {
        platformId: task.platformId,
        projectId: task.projectId,
        todoId: task.id,
        cursor: undefined,
        limit: 10,
      });
      return { comments: response.data };
    },
    staleTime: 0,
    gcTime: 0,
    enabled: task.id !== undefined,
  });

  return (
    <div className="flex flex-col w-full pt-2 gap-2">
      <span className="text-lg font-bold mb-2"> Comments </span>
      {comments?.comments.length === 0 && (
        <span className="text-sm text-muted-foreground">No comments yet</span>
      )}

      {isLoadingComments && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Skeleton className="h-[30px] w-[30px] rounded-xl" />
              <Skeleton className="h-[30px] w-[100px] rounded-xl" />
            </div>
            <Skeleton className="h-[50px] w-full rounded-xl" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Skeleton className="h-[30px] w-[30px] rounded-xl" />
              <Skeleton className="h-[30px] w-[100px] rounded-xl" />
            </div>
            <Skeleton className="h-[50px] w-full rounded-xl" />
          </div>
        </div>
      )}
      {!isLoadingComments &&
        comments?.comments.map((comment) => (
          <CommentCard
            key={comment.id}
            firstName={comment.user.firstName}
            lastName={comment.user.lastName}
            content={comment.content}
            createdAt={comment.created}
          />
        ))}
    </div>
  );
}

export { Comments };
