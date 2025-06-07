import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { PopulatedTodo, Todo } from '@activepieces/shared';

import { TodoDetails } from './todo-details';

type TodoDetailsProps = {
  open: boolean;
  currentTodo: PopulatedTodo;
  onStatusChange: (status: Todo['status']) => void;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
};

function TodoDetailsDrawer({
  open,
  currentTodo,
  onStatusChange,
  onOpenChange,
  onClose,
}: TodoDetailsProps) {
  return (
    <Drawer
      dismissible={false}
      open={open}
      onOpenChange={onOpenChange}
      className="w-2/3 max-w-4xl"
      onClose={onClose}
    >
      <DrawerContent>
        <div className="px-6">
          <TodoDetails
            todoId={currentTodo.id}
            onClose={onClose}
            onStatusChange={onStatusChange}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export { TodoDetailsDrawer };
