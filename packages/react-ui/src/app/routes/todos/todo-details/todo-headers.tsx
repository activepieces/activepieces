import { CheckCircle, CircleDot, X, ChevronDown, ExternalLink, Workflow } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { STATUS_COLORS, STATUS_VARIANT, Todo, UNRESOLVED_STATUS, StatusOption, PopulatedTodo } from '@activepieces/shared';
import { todosHooks } from '@/features/todos/lib/todo-hook';
import { cn } from '@/lib/utils';
import { todoUtils } from '../todo-utils';
import { ApAvatar } from '@/components/custom/ap-avatar';

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
            // Open the run in a new tab/window
            window.open(`/runs/${todo.runId}`, '_blank');
        }
    };

 
    return (
        <div className={`flex flex-col w-full py-3 px-4  ${className}`}>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" aria-label="Close">
                        <X className="h-4 w-4" />
                    </Button>

                    <h2 className="text-lg font-semibold mr-2">{title}</h2>
                    
                    {status && STATUS_COLORS && (
                        <StatusIconWithText
                            icon={todoUtils.getStatusIcon(status.variant)}
                            text={status.name}
                            color={STATUS_COLORS[status.variant].color}
                            textColor={STATUS_COLORS[status.variant].textColor}
                        />
                    )}
                </div>

                {!isResolved && (
                    <div className="ml-auto">
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
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 mt-2">

                {todo.assignee && (
                    <ApAvatar
                        fullName={todo.assignee.firstName + ' ' + todo.assignee.lastName}
                        userEmail={todo.assignee.email}
                        size="small"
                        includeName={true}
                    />
                )}

                {todo.flow && (
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 h-8" onClick={handleFlowClick}>
                        <Workflow className="h-4 w-4" />
                        <span>{todo.flow.version.displayName}</span>
                        <ExternalLink className="h-3 w-3" />
                    </Button>
                )}

            </div>
        </div>
    );
}; 