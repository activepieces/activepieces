import { TodoList, type Todo } from './todo-list';
import { TodoView } from './todo-view';
import { todosHooks } from '@/features/todos/lib/todo-hook';
import { TodosStateProvider } from './todos-state-provider';
import { LoadingScreen } from '@/components/ui/loading-screen';


function TodosPage() {

  const { data: todos, isLoading } = todosHooks.useTodosList('all');

  if (isLoading) {
    return (
        <LoadingScreen mode="container"></LoadingScreen>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <TodosStateProvider todos={todos?.data ?? []}>
        <TodoList />
        <TodoView />
      </TodosStateProvider>
    </div>
  );
}

export { TodosPage };
