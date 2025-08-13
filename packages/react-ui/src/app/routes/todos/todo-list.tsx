import { Todo, STATUS_VARIANT as TodoStatusVariant } from '@activepieces/shared';
import { todoUtils } from './todo-utils';
import { useTodosState } from './todos-state-provider';
import { formatUtils } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, Check, Workflow } from 'lucide-react';
import { useState } from 'react';
import { authenticationSession } from '@/lib/authentication-session';
import { t } from 'i18next';
import { ApAvatar } from '@/components/custom/ap-avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

function TodoList() {
  const [todos, selectedTodo, setSelectedTodo] = useTodosState((state) => [state.todos, state.selectedTodo, state.setSelectedTodo]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showOnlyMe, setShowOnlyMe] = useState(true);
  const currentUserId = authenticationSession.getCurrentUserId()

  const handleTodoSelect = (todo: Todo) => {
    setSelectedTodo(todo);
  };

  const filteredTodos = todos.filter((todo) => {
    if (!showCompleted && [TodoStatusVariant.POSITIVE, TodoStatusVariant.NEGATIVE].includes(todo.status.variant)) {
      return false;
    }
    return !showOnlyMe || todo.assigneeId === currentUserId;
  });

  return (
    <div className="w-[400px] flex flex-col border-r">
      {/* Filter Bar */}
      <div className="border-b px-4 py-3 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Filter className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowOnlyMe(!showOnlyMe)}
            >
              <span className="text-sm">{t("Only Me")}</span>
              {showOnlyMe && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              <span className="text-sm">{t("Show Completed")}</span>
              {showCompleted && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-1">
          {showOnlyMe && (
            <Badge variant="outline" className="text-xs">
              {t("Only Me")}
            </Badge>
          )}
          {showCompleted && (
            <Badge variant="outline" className="text-xs">
              {t("All Todos")}
            </Badge>
          )}
        </div>
      </div>

      {/* Todo List */}
      <ScrollArea className="flex-1">
        <div className="py-3 px-2 space-y-1">
          {filteredTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <p className="text-muted-foreground text-center">
                {t('You have empty inbox')}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`rounded-lg py-2 px-4 hover:bg-accent cursor-pointer transition-colors ${selectedTodo?.id === todo.id ? 'bg-accent' : ''
                  }`}
                onClick={() => handleTodoSelect(todo)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {todo.assignee ? (
                      <ApAvatar
                        fullName={todo.assignee.firstName + ' ' + todo.assignee.lastName}
                        userEmail={todo.assignee.email}
                        size="small"
                      />
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Workflow className="w-4 h-4 text-muted-forseground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{todo.flow?.version.displayName || 'Workflow'}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium truncate flex-1 mr-2">{todo.title}</h3>
                      <p className="text-xs text-accent-foreground flex-shrink-0">
                        {formatUtils.formatDateToAgo(new Date(todo.created))}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate flex-1 mr-2">
                        {todo.description === '' ? t('No description') : todo.description}
                      </p>
                      <div className="flex-shrink-0">
                        {todoUtils.getStatusIconComponent(todo.status.variant)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export { TodoList };
export type { Todo }; 