import {
  RightDrawer,
  RightDrawerContent,
} from '@/components/right-drawer';
import {
  PopulatedTodo,
  Todo,
} from '@activepieces/shared';

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
    <RightDrawer
      dismissible={false}
      open={open}
      onOpenChange={onOpenChange}
      className="w-2/3 max-w-4xl"
      onClose={onClose}
    >
      <RightDrawerContent>
          <TodoDetails todoId={currentTodo.id} onClose={onClose} onStatusChange={onStatusChange} />
      </RightDrawerContent>
    </RightDrawer>
  );
}

export { TodoDetailsDrawer };
