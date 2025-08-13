import { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { create } from 'zustand';

import { PopulatedTodo, Todo, TodoActivityWithUser } from '@activepieces/shared';
import { todosApi } from '@/features/todos/lib/todos-api';

interface TodosState {
  selectedTodo: PopulatedTodo | null;
  setSelectedTodo: (todo: PopulatedTodo | null) => void;
  comments: TodoActivityWithUser[];
  todos: PopulatedTodo[];
  updateTodoStatus: (todoId: string, status: PopulatedTodo['status']) => Promise<void>;
}

type TodosStore = ReturnType<typeof createTodosStore>;

const createTodosStore = (todos: Todo[]) =>
  create<TodosState>((set, get) => ({
    selectedTodo: null,
    setSelectedTodo: (todo) => set({ selectedTodo: todo }),
    comments: [],
    todos: todos,
    updateTodoStatus: async (todoId, status) => {
      try {
        
        set((state) => {
          const updatedTodos = state.todos.map(todo => 
            todo.id === todoId ? { ...todo, status } : todo
          );
          const updatedSelectedTodo = state.selectedTodo?.id === todoId 
            ? { ...state.selectedTodo, status }
            : state.selectedTodo;
          
          return {
            todos: updatedTodos,
            selectedTodo: updatedSelectedTodo
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
}: {
  children: React.ReactNode;
  todos: Todo[];
}) {
  const storeRef = useRef<TodosStore>();
  
  if (!storeRef.current) {
    storeRef.current = createTodosStore(todos);
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
