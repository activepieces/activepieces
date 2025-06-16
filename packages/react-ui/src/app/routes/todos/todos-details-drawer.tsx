import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PopulatedTodo, Todo } from '@activepieces/shared';

import { TodoDetails } from './todo-details';

type TodoDetailsProps = {
  open: boolean;
  agentId?: string;
  currentTodo: PopulatedTodo | null;
  onStatusChange: (status: Todo['status']) => void;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
};

function TodoDetailsDrawer({
  open,
  agentId,
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
        <ScrollArea>
          <div className="px-6">
            <TodoDetails
              todoId={currentTodo?.id ?? null}
              onClose={onClose}
              agentId={agentId}
              onStatusChange={onStatusChange}
            />
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}

export { TodoDetailsDrawer };
