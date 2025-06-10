import { useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { isNil, PopulatedTodo, Todo } from '@activepieces/shared';

import { TodoDetails } from './todo-details';
import { TodoCreateTodo } from './todo-details/todo-create-todo';

type TodoDetailsProps = {
  open: boolean;
  agentId?: string;
  currentTodo: PopulatedTodo | null;
  onStatusChange: (status: Todo['status']) => void;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onTodoCreated?: (todo: PopulatedTodo) => void;
};

function TodoDetailsDrawer({
  open,
  agentId,
  currentTodo,
  onStatusChange,
  onOpenChange,
  onClose,
  onTodoCreated,
}: TodoDetailsProps) {
  const [createdTodo, setCreatedTodo] = useState<PopulatedTodo | null>(null);

  const displayedTodo = createdTodo ?? currentTodo;

  const handleTodoCreated = (todo: PopulatedTodo) => {
    setCreatedTodo(todo);
    onTodoCreated?.(todo);
  };

  return (
    <Drawer
      dismissible={false}
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setCreatedTodo(null);
          onClose();
        }
        onOpenChange(open);

      }}
      className="w-2/3 max-w-4xl"
      onClose={onClose}
    >
      <DrawerContent>
        <div className="px-6">
          {displayedTodo && (
            <TodoDetails
              todoId={displayedTodo.id}
              onClose={onClose}
              onStatusChange={onStatusChange}
            />
          )}
          {isNil(displayedTodo) && !isNil(agentId) && (
            <TodoCreateTodo
              onTodoCreated={handleTodoCreated}
              agentId={agentId}
              onClose={() => {
                setCreatedTodo(null);
                onOpenChange(false);
              }}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export { TodoDetailsDrawer };
