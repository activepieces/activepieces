import { useEffect, useRef } from 'react';

import { TodoHeaders } from '@/app/routes/todos/todo-details/todo-headers';
import { ApMarkdown } from '@/components/custom/markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Todo, UNRESOLVED_STATUS, MarkdownVariant } from '@activepieces/shared';

import { TodoTimeline } from './todo-timeline';

type TodoDetailsProps = {
  onStatusChange?: (status: Todo['status'], source: 'agent' | 'manual') => void;
  onClose?: () => void;
  className?: string;
  todo: Todo;
  updateTodoStatus: (todoId: string, status: Todo['status']) => Promise<void>;
  hideComments?: boolean;
};

export const TodoDetails = ({
  todo,
  onStatusChange,
  onClose,
  className,
  updateTodoStatus,
  hideComments = false,
}: TodoDetailsProps) => {
  const previousStatus = useRef<Todo['status']>();

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

  return (
    <div className={cn('flex flex-col w-full h-full p-4', className)}>
      <TodoHeaders
        title={todo.title}
        onClose={() => {
          onClose?.();
        }}
        todo={todo}
        updateTodoStatus={updateTodoStatus}
      />
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground mt-8">
            <ApMarkdown
              markdown={todo.description}
              variant={MarkdownVariant.BORDERLESS}
            />
          </div>
        </div>
        {!hideComments && (
          <div>
            <TodoTimeline todo={todo} />
            <div className="mb-10"></div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
