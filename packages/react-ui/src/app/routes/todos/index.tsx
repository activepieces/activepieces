import { useSearchParams } from 'react-router-dom';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { todosHooks } from '@/features/todos/lib/todo-hook';

import { TodoList } from './todo-list';
import { TodoView } from './todo-view';
import { TodosStateProvider } from './todos-state-provider';

function TodosPage() {
  const { data: todos, isLoading } = todosHooks.useTodosList();

  const [searchParams] = useSearchParams();

  if (isLoading) {
    return <LoadingScreen mode="container"></LoadingScreen>;
  }

  return (
    <div className="flex h-full overflow-hidden">
      <TodosStateProvider
        todos={todos?.data ?? []}
        selectedTodoId={searchParams.get('id') ?? null}
      >
        <TodoList />
        <TodoView />
      </TodosStateProvider>
    </div>
  );
}

export { TodosPage };
