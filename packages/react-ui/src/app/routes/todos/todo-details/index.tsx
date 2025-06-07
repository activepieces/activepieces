import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ScrollArea } from '@/components/ui/scroll-area';
import { todosHooks } from '@/features/todos/lib/todo-hook';
import { todosApi } from '@/features/todos/lib/todos-api';
import { cn } from '@/lib/utils';
import {
  Todo,
  TodoChanged,
  WebsocketClientEvent,
  UNRESOLVED_STATUS,
} from '@activepieces/shared';

import { TodoCreateComment } from './todo-create-comment';
import { TodoDetailsStatus } from './todo-details-status';
import { TodoTimeline } from './todo-timeline';

type TodoDetailsProps = {
  todoId: string;
  onClose?: () => void;
  onStatusChange?: (status: Todo['status'], source: 'agent' | 'manual') => void;
  className?: string;
};

export const TodoDetails = ({
  todoId,
  onClose,
  onStatusChange,
  className,
}: TodoDetailsProps) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const socket = useSocket();
  const previousStatus = useRef<Todo['status']>();
  const { data: todo, isLoading, refetch } = todosHooks.useTodo(todoId);

  const handleTodoChanged = async (event: TodoChanged) => {
    if (event.todoId === todoId) {
      const result = await refetch();
      const updatedTodo = result.data;

      if (updatedTodo && previousStatus.current) {
        const wasUnresolved =
          previousStatus.current.name === UNRESOLVED_STATUS.name;
        const isNowResolved =
          updatedTodo.status.name !== UNRESOLVED_STATUS.name &&
          updatedTodo.status.continueFlow !== false;

        if (wasUnresolved && isNowResolved) {
          onStatusChange?.(updatedTodo.status, 'agent');
        }
      }
      previousStatus.current = updatedTodo?.status;
    }
  };

  useEffect(() => {
    socket.on(WebsocketClientEvent.TODO_CHANGED, handleTodoChanged);

    return () => {
      socket.off(WebsocketClientEvent.TODO_CHANGED, handleTodoChanged);
    };
  }, [socket, refetch, todoId]);

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
    <div className={cn('flex flex-col w-full h-[100vh]', className)}>
      {isLoading && <LoadingScreen mode="container"></LoadingScreen>}
      {!isLoading && todo && (
        <ScrollArea className="flex-1 px-0">
          <div className="flex flex-col py-5 gap-2">
            <div className="flex items-center gap-2">
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              )}
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
            </div>
            {todo && (
              <>
                <TodoTimeline todo={todo} />
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
