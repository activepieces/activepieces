import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PopulatedTodo } from '@activepieces/shared';

import { agentsApi } from '../../agents/agents-api';

import { TodoTextarea } from './todo-textarea';

type TodoCreateTodoProps = {
  onTodoCreated?: (todo: PopulatedTodo) => void;
  agentId: string;
  onClose: () => void;
};

export const TodoCreateTodo = ({
  onTodoCreated,
  agentId,
  onClose,
}: TodoCreateTodoProps) => {
  const mutation = useMutation({
    mutationFn: async (content: string) => {
      return agentsApi.run(agentId, { prompt: content });
    },
    onSuccess: (todo: PopulatedTodo) => {
      onTodoCreated?.(todo);
    },
  });

  const handleCreateTodo = async (content: string): Promise<void> => {
    await mutation.mutateAsync(content);
  };

  return (
    <div className="flex flex-col py-5 gap-2">
      <div className="flex items-center gap-2">
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
        <div className="text-2xl font-bold flex items-center gap-4">
          <div className="max-w-[40ch] truncate">Create New Todo</div>
        </div>
      </div>
      <TodoTextarea
        onSubmit={handleCreateTodo}
        placeholder="Describe what you want to do..."
        title=""
      />
    </div>
  );
};
