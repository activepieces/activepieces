import {
  RightDrawer,
  RightDrawerContent,
} from '@/components/right-drawer';
import {
  TodoWithAssignee,
} from '@activepieces/shared';

import { TodoDetails } from './todo-details';

type TodoDetailsProps = {
  open: boolean;
  currentTodo: TodoWithAssignee;
  isTesting?: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
};

function TodoDetailsDrawer({
  open,
  currentTodo,
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
          <TodoDetails todoId={currentTodo.id} onClose={onClose} />
      </RightDrawerContent>
    </RightDrawer>
  );
}

export { TodoDetailsDrawer };
