import { createContext, useContext, useRef } from 'react';
import { useStore, create } from 'zustand';

import { todosApi } from '@/features/todos/lib/todos-api';
import {
  PopulatedTodo,
  Todo,
  TodoActivityWithUser,
} from '@activepieces/shared';

interface TodosState {
  selectedTodo: PopulatedTodo | null;
  setSelectedTodo: (todo: PopulatedTodo | null) => void;
  comments: TodoActivityWithUser[];
  todos: PopulatedTodo[];
  updateTodoStatus: (
    todoId: string,
    status: PopulatedTodo['status'],
  ) => Promise<void>;
}

type TodosStore = ReturnType<typeof createTodosStore>;

const createTodosStore = (todos: Todo[], selectedTodoId: string | null) =>
  create<TodosState>((set) => ({
    selectedTodo: todos.find((todo) => todo.id === selectedTodoId) || null,
    setSelectedTodo: (todo) => set({ selectedTodo: todo }),
    comments: [],
    todos: todos,
    updateTodoStatus: async (todoId, status) => {
      try {
        set((state) => {
          const updatedTodos = state.todos.map((todo) =>
            todo.id === todoId ? { ...todo, status } : todo,
          );
          const updatedSelectedTodo =
            state.selectedTodo?.id === todoId
              ? { ...state.selectedTodo, status }
              : state.selectedTodo;

          return {
            todos: updatedTodos,
            selectedTodo: updatedSelectedTodo,
          };
        });
        await todosApi.update(todoId, { status });
      } catch (error) {
        console.error('Failed to update todo status:', error);
        throw error;
      }
    },
  }));

const TodosContext = createContext<TodosStore | null>(null);

export function TodosStateProvider({
  children,
  todos,
  selectedTodoId,
}: {
  children: React.ReactNode;
  todos: Todo[];
  selectedTodoId: string | null;
}) {
  const storeRef = useRef<TodosStore>();

  if (!storeRef.current) {
    console.log('Creating todos store');
    storeRef.current = createTodosStore(todos, selectedTodoId);
  }

  return (
    <TodosContext.Provider value={storeRef.current}>
      {children}
    </TodosContext.Provider>
  );
}

export function useTodosState<T>(selector: (state: TodosState) => T) {
  const todosStore = useContext(TodosContext);
  if (!todosStore) {
    throw new Error('Todos context not found');
  }
  return useStore(todosStore, selector);
}
