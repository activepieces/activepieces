import { X, ChevronDown, ExternalLink, Workflow } from 'lucide-react';

import { ApAvatar } from '@/components/custom/ap-avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import {
  STATUS_COLORS,
  Todo,
  UNRESOLVED_STATUS,
  PopulatedTodo,
} from '@activepieces/shared';

import { todoUtils } from '../todo-utils';

interface TodoHeadersProps {
  title: string;
  onClose: () => void;
  className?: string;
  todo: PopulatedTodo;
  updateTodoStatus: (todoId: string, status: Todo['status']) => Promise<void>;
}

export const TodoHeaders = ({
  title,
  onClose,
  className = '',
  todo,
  updateTodoStatus,
}: TodoHeadersProps) => {
  const isResolved =
    todo.status.name !== UNRESOLVED_STATUS.name &&
    todo.status.continueFlow !== false;

  const status = todo.status;

  const handleStatusUpdate = async (newStatus: Todo['status']) => {
    await updateTodoStatus(todo.id, newStatus);
  };

  const handleFlowClick = () => {
    if (todo.runId) {
      window.open(`/runs/${todo.runId}`, '_blank');
    }
  };

  return (
    <div className={`flex flex-col w-full  ${className}`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>

          {status && STATUS_COLORS && (
            <StatusIconWithText
              icon={todoUtils.getStatusIcon(status.variant)}
              text={status.name}
              color={STATUS_COLORS[status.variant].color}
              textColor={STATUS_COLORS[status.variant].textColor}
            />
          )}

          {todo.assignee && (
            <ApAvatar
              fullName={todo.assignee.firstName + ' ' + todo.assignee.lastName}
              userEmail={todo.assignee.email}
              size="small"
              includeName={true}
            />
          )}

          {todo.flow && (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 h-8"
              onClick={handleFlowClick}
            >
              <Workflow className="h-4 w-4" />
              <span>{todo.flow.version.displayName}</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isResolved && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="h-8 w-28">
                  Mark as
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-32">
                {(todo.statusOptions ?? []).map((todoStatus) => {
                  return (
                    <DropdownMenuItem
                      key={todoStatus.name}
                      onClick={() => handleStatusUpdate(todoStatus)}
                    >
                      <div className="flex items-center gap-2">
                        {todoUtils.getStatusIconComponent(todoStatus.variant)}
                        <span>{todoStatus.name}</span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
