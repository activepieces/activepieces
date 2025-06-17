import { MessageCircleIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface AgentTodosSidebarProps {
  agentId: string;
}

// Dummy todos for demonstration
const dummyTodos = [
  { id: '1', text: 'Review agent instructions' },
  { id: '2', text: 'Test agent output' },
  { id: '3', text: 'Refine system prompt' },
];

export const AgentTodosSidebar = ({ agentId }: AgentTodosSidebarProps) => {
  const [todos, setTodos] = useState(dummyTodos);

  const handleAddTodo = () => {
    // In real usage, open a dialog or input for new todo
    const newTodo = {
      id: (todos.length + 1).toString(),
      text: `New Todo ${todos.length + 1}`,
    };
    setTodos([newTodo, ...todos]);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col gap-2 py-4">
        <Button
          variant="basic"
          onClick={handleAddTodo}
          className="w-full text-foreground justify-start"
        >
          <MessageCircleIcon className="w-4 h-4 mr-2" />
          New Todo
        </Button>
        <h2 className="text-lg font-semibold">Todos</h2>
      </div>
      <div className="flex-1 overflow-auto">
        {todos.length === 0 ? (
          <div className="text-muted-foreground text-sm mt-4">No todos yet.</div>
        ) : (
          <ul className="space-y-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="bg-muted rounded px-3 py-2 text-sm"
              >
                {todo.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};