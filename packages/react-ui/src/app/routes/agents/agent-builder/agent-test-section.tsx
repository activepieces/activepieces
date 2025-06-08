import { Check, X, ChevronRight, CircleDot, Activity } from 'lucide-react';
import { useState } from 'react';

import { TodoDetailsDrawer } from '@/app/routes/todos/todos-details-drawer';
import {
  CardList,
  CardListEmpty,
  CardListItem,
} from '@/components/custom/card-list';
import { Skeleton } from '@/components/ui/skeleton';
import { todosHooks } from '@/features/todos/lib/todo-hook';
import { cn } from '@/lib/utils';
import { PopulatedTodo, STATUS_VARIANT } from '@activepieces/shared';

import { AgentTestRunButton } from './agent-test-run-button';

type AgentTestSectionProps = {
  agentId: string;
};

function getStatusIcon(variant: STATUS_VARIANT) {
  switch (variant) {
    case STATUS_VARIANT.POSITIVE:
      return { Icon: Check, variant: 'success' };
    case STATUS_VARIANT.NEGATIVE:
      return { Icon: X, variant: 'error' };
    case STATUS_VARIANT.NEUTRAL:
      return { Icon: CircleDot, variant: 'default' };
  }
}

export const AgentTestSection = ({ agentId }: AgentTestSectionProps) => {
  const {
    data: todosData,
    isLoading,
    isError,
    refetch,
  } = todosHooks.useTodosList('all', agentId);
  const [selectedTodo, setSelectedTodo] = useState<PopulatedTodo | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-2">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <span>Activity History</span>
        </h2>
      </div>
      <div className="flex-1 flex flex-col mt-4">
        <CardList className="flex-1">
          {isLoading &&
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex flex-col gap-2 p-4">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          {isError && (
            <div className="text-center text-sm text-destructive">
              Error loading test history.
            </div>
          )}
          {todosData?.data && todosData.data.length === 0 && (
            <CardListEmpty message="The agent does not have any activity yet." />
          )}
          {todosData?.data &&
            todosData.data.length > 0 &&
            todosData.data.map((todo) => {
              const { Icon, variant } = getStatusIcon(todo.status.variant);
              return (
                <CardListItem
                  className={cn('px-3 cursor-pointer hover:bg-accent')}
                  key={todo.id}
                  onClick={() => {
                    setSelectedTodo(todo);
                    setDrawerOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center h-full">
                      <Icon
                        className={cn('h-4 w-4', {
                          'text-success': variant === 'success',
                          'text-destructive': variant === 'error',
                          'text-muted-foreground': variant === 'default',
                        })}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {todo.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(todo.created).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center h-full">
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardListItem>
              );
            })}
        </CardList>
      </div>

      <div className="mt-auto pt-4">
        <AgentTestRunButton
          onSuccess={(todo) => {
            setSelectedTodo(todo);
            setDrawerOpen(true);
            refetch();
          }}
          agentId={agentId}
        />
      </div>

      {selectedTodo && (
        <TodoDetailsDrawer
          key={selectedTodo.id}
          currentTodo={selectedTodo}
          onStatusChange={() => {
            refetch();
          }}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onClose={() => {
            setSelectedTodo(null);
            setDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
};
