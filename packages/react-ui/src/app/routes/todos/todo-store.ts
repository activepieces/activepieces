import { create } from 'zustand';

import { Todo } from '@activepieces/shared';

interface TodoState {
  todos: Todo[];
  selectedTodoId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface TodoActions {
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  updateTodo: (todoId: string, updates: Partial<Todo>) => void;
  updateTodoStatus: (todoId: string, status: Todo['status']) => void;
  removeTodo: (todoId: string) => void;
  setSelectedTodoId: (todoId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type TodoStore = TodoState & TodoActions;

export const useTodoStore = create<TodoStore>((set, get) => ({
  // Initial state
  todos: [],
  selectedTodoId: null,
  isLoading: false,
  error: null,

  // Actions
  setTodos: (todos) => set({ todos }),

  addTodo: (todo) =>
    set((state) => ({
      todos: [...state.todos, todo],
    })),

  updateTodo: (todoId, updates) =>
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === todoId ? { ...todo, ...updates } : todo,
      ),
    })),

  updateTodoStatus: (todoId, status) =>
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === todoId ? { ...todo, status } : todo,
      ),
    })),

  removeTodo: (todoId) =>
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== todoId),
    })),

  setSelectedTodoId: (todoId) => set({ selectedTodoId: todoId }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));

// Selector hooks for better performance
export const useTodos = () => useTodoStore((state) => state.todos);
export const useSelectedTodoId = () =>
  useTodoStore((state) => state.selectedTodoId);
export const useSelectedTodo = () =>
  useTodoStore((state) =>
    state.todos.find((todo) => todo.id === state.selectedTodoId),
  );
export const useTodoLoading = () => useTodoStore((state) => state.isLoading);
export const useTodoError = () => useTodoStore((state) => state.error);

// Action hooks
export const useTodoActions = () =>
  useTodoStore((state) => ({
    setTodos: state.setTodos,
    addTodo: state.addTodo,
    updateTodo: state.updateTodo,
    updateTodoStatus: state.updateTodoStatus,
    removeTodo: state.removeTodo,
    setSelectedTodoId: state.setSelectedTodoId,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
  }));
