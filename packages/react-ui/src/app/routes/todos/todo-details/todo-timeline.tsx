import { ArrowUp, Loader2, MessageCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { MessageBox } from '@/components/custom/message-box';
import { Separator } from '@/components/ui/separator';
import { todoActivityApi } from '@/features/todos/lib/todos-activitiy-api';
import { todoActivitiesHook } from '@/features/todos/lib/todos-activity-hook';
import { TodoActivityWithUser, PopulatedTodo } from '@activepieces/shared';

import { TodoComment, ActivityItem } from './todo-comment';
import { TodoTimelineCommentSkeleton } from './todo-timeline-comment-skeleton';

interface TodoTimelineProps {
  todo: PopulatedTodo;
}

export const TodoTimeline = ({ todo }: TodoTimelineProps) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: comments,
    isLoading,
    refetch,
  } = todoActivitiesHook.useComments(todo.id);

  const formatComment = (activity: TodoActivityWithUser): ActivityItem => {
    const hash = encodeURIComponent(JSON.stringify(activity.content));
    return {
      type: 'comment' as const,
      content: activity.content,
      timestamp: new Date(activity.created),
      authorName: activity.user?.firstName + ' ' + activity.user?.lastName,
      key: hash,
      id: activity.id,
    };
  };

  const activities = useMemo(() => {
    return comments?.data?.map(formatComment) ?? [];
  }, [comments?.data]);

  const handleSubmitComment = async (content: string) => {
    if (todo.locked) return;
    await todoActivityApi.create({
      todoId: todo.id,
      content: content,
    });
    refetch();
  };

  const handleSubmit = async () => {
    if (!content.trim() || todo.locked) return;

    setIsSubmitting(true);
    try {
      await handleSubmitComment(content);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col mt-4">
      <Separator className="mb-4" />
      <h3 className="text-lg font-semibold mb-4">Comments</h3>
      {isLoading ? (
        <>
          {/* Show skeleton for loading comments */}
          <TodoTimelineCommentSkeleton showConnector={true} />
          <TodoTimelineCommentSkeleton showConnector={true} />
          <TodoTimelineCommentSkeleton showConnector={false} />
        </>
      ) : (
        <>
          {activities.length > 0 ? (
            activities.map((comment) => (
              <TodoComment key={comment.id} comment={comment} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                No comments yet. Be the first to leave a comment!
              </p>
            </div>
          )}
        </>
      )}
      {!todo.locked && !isLoading && (
        <div className="mt-4 mb-8">
          <MessageBox
            placeholder="Leave a comment..."
            actionName=""
            value={content}
            onChange={setContent}
            onAction={handleSubmit}
            loading={isSubmitting}
            disabled={todo.locked}
            rows={1}
            actionIcon={<ArrowUp className="w-5 h-5" />}
            loadingIcon={<Loader2 className="w-5 h-5 animate-spin" />}
            loadingText=""
          />
        </div>
      )}
    </div>
  );
};
