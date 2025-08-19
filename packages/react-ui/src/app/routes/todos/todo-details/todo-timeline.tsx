import { useEffect, useState } from 'react';

import { useSocket } from '@/components/socket-provider';
import { todoUtils } from '@/features/todos/lib/todo-utils';
import {
  TodoChanged,
  WebsocketClientEvent,
  TodoActivityWithUser,
  TodoActivityChanged,
  PopulatedTodo,
} from '@activepieces/shared';

import { TodoComment, ActivityItem } from './todo-comment';
import { TodoTimelineCommentSkeleton } from './todo-timeline-comment-skeleton';
import { TodoTimelineStatus } from './todo-timeline-status';

interface TodoTimelineProps {
  todo: PopulatedTodo;
  comments: TodoActivityWithUser[];
  isLoading: boolean;
  refetchComments: () => void;
}

export const TodoTimeline = ({
  todo,
  comments,
  isLoading,
  refetchComments,
}: TodoTimelineProps) => {
  const socket = useSocket();

  const formatComment = (activity: TodoActivityWithUser): ActivityItem => {
    const hash = encodeURIComponent(JSON.stringify(activity.content));
    return {
      type: 'comment' as const,
      authorType: todoUtils.getAuthorType(activity),
      content: activity.content,
      timestamp: new Date(activity.created),
      authorName: todoUtils.getAuthorName(activity),
      key: hash,
      id: activity.id,
    };
  };

  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      type: 'comment' as const,
      content: todo.description ?? '',
      timestamp: new Date(todo.created),
      authorType: todoUtils.getAuthorType(todo),
      authorName: todoUtils.getAuthorName(todo),
      userEmail: todo.createdByUser?.email,
      flowId: todo.flowId,
    },
    ...(comments ?? []).map(formatComment),
  ]);

  useEffect(() => {
    const handleTodoChanged = (event: TodoChanged) => {
      if (event.todoId === todo.id) {
        refetchComments();
      }
    };
    const handleTodoActivityChanged = (event: TodoActivityChanged) => {
      setActivities((prev) => {
        const newActivities = prev.map((activity) => {
          if (activity.id === event.activityId) {
            return { ...activity, content: event.content };
          }
          return activity;
        });
        return newActivities;
      });
    };

    socket.on(WebsocketClientEvent.TODO_CHANGED, handleTodoChanged);
    socket.on(
      WebsocketClientEvent.TODO_ACTIVITY_CHANGED,
      handleTodoActivityChanged,
    );

    return () => {
      socket.off(WebsocketClientEvent.TODO_CHANGED, handleTodoChanged);
      socket.off(
        WebsocketClientEvent.TODO_ACTIVITY_CHANGED,
        handleTodoActivityChanged,
      );
    };
  }, [socket, refetchComments]);

  return (
    <div className="flex flex-col mt-4">
      {isLoading ? (
        <>
          <TodoComment
            comment={{
              type: 'comment' as const,
              content: todo.description ?? '',
              timestamp: new Date(todo.created),
              authorType: todoUtils.getAuthorType(todo),
              authorName: todoUtils.getAuthorName(todo),
              userEmail: todo.createdByUser?.email,
              flowId: todo.flowId,
            }}
            showConnector={true}
          />
          {/* Show skeleton for loading comments */}
          <TodoTimelineCommentSkeleton showConnector={true} />
          <TodoTimelineCommentSkeleton showConnector={true} />
          <TodoTimelineCommentSkeleton showConnector={false} />
        </>
      ) : (
        <>
          {activities.map((comment, index) => (
            <TodoComment
              key={comment.id}
              comment={comment}
              showConnector={index !== activities.length - 1}
            />
          ))}
          <TodoTimelineStatus todo={todo} />
        </>
      )}
    </div>
  );
};
