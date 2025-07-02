import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ScrollArea } from '@/components/ui/scroll-area';
import { todosHooks } from '@/features/todos/lib/todo-hook';
import { todoActivitiesHook } from '@/features/todos/lib/todos-activity-hook';
import { todosApi } from '@/features/todos/lib/todos-api';
import { cn } from '@/lib/utils';
import {
  Todo,
  TodoChanged,
  WebsocketClientEvent,
  UNRESOLVED_STATUS,
  TodoActivityCreated,
} from '@activepieces/shared';

import { TodoCreateComment } from './todo-create-comment';
import { TodoDetailsStatus } from './todo-details-status';
import { TodoTimeline } from './todo-timeline';

type TodoDetailsProps = {
  todoId: string | null;
  onClose?: () => void;
  onStatusChange?: (status: Todo['status'], source: 'agent' | 'manual') => void;
  className?: string;
  simpleTitle?: boolean;
};

export const TodoDetails = ({
  todoId,
  onClose,
  onStatusChange,
  className,
  simpleTitle = false,
}: TodoDetailsProps) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const socket = useSocket();
  const previousStatus = useRef<Todo['status']>();
  const { data: todo, isLoading, refetch } = todosHooks.useTodo(todoId);

  function detectStatusChange(updatedTodo: Todo) {
    if (updatedTodo && previousStatus.current) {
      const wasUnresolved =
        previousStatus.current.name === UNRESOLVED_STATUS.name;
      const isNowResolved = updatedTodo.status.name !== UNRESOLVED_STATUS.name;

      if (wasUnresolved && isNowResolved) {
        onStatusChange?.(updatedTodo.status, 'agent');
      }
    }
    previousStatus.current = updatedTodo?.status;
  }

  useEffect(() => {
    if (todo) {
      detectStatusChange(todo);
    }
  }, [todo]);

  const handleTodoChanged = async (event: TodoChanged) => {
    if (event.todoId === todoId) {
      await refetch();
    }
  };

  const handleTodoActivityCreated = async (event: TodoActivityCreated) => {
    if (event.todoId === todoId) {
      await refetchComments();
    }
  };

  useEffect(() => {
    socket.on(WebsocketClientEvent.TODO_CHANGED, handleTodoChanged);
    socket.on(
      WebsocketClientEvent.TODO_ACTIVITY_CREATED,
      handleTodoActivityCreated,
    );
    return () => {
      socket.off(WebsocketClientEvent.TODO_CHANGED, handleTodoChanged);
      socket.off(
        WebsocketClientEvent.TODO_ACTIVITY_CREATED,
        handleTodoActivityCreated,
      );
    };
  }, [socket, refetch, todoId]);

  const {
    data: comments,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = todoActivitiesHook.useComments(todoId);

  const handleStatusChange = async (
    status: Todo['status'],
    source: 'agent' | 'manual',
  ) => {
    if (!todo) return;
    setIsUpdatingStatus(true);
    try {
      await todosApi.update(todo.id, { status });
      onStatusChange?.(status, source);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className={cn('flex flex-col w-full ', className)}>
      {isLoading && <LoadingScreen mode="container"></LoadingScreen>}
      {!isLoading && todo && (
        <ScrollArea className="flex-1 px-0">
          <div className="flex flex-col py-2 gap-2">
            <div className="flex items-center gap-2">
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              )}
              {!simpleTitle && (
                <div className="text-2xl font-bold flex items-center gap-4">
                  <div className="max-w-[40ch] truncate">{todo?.title}</div>
                  {todo && (
                    <TodoDetailsStatus
                      todo={todo}
                      isUpdatingStatus={isUpdatingStatus}
                      onStatusChange={handleStatusChange}
                    />
                  )}
                </div>
              )}
              {simpleTitle && (
                <div className="text-lg font-bold flex items-center gap-4">
                  <div className="max-w-[40ch] truncate">{todo?.title}</div>
                </div>
              )}
            </div>
            {todo && (
              <>
                <TodoTimeline
                  todo={todo}
                  comments={comments?.data ?? []}
                  isLoading={isLoadingComments}
                  refetchComments={refetchComments}
                />
                <TodoCreateComment todo={todo} />
              </>
            )}
          </div>
          <div className="mb-10"></div>
        </ScrollArea>
      )}
    </div>
  );
};
