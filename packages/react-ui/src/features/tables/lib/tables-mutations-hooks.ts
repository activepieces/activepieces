import { UseMutationResult } from '@tanstack/react-query';
import { create } from 'zustand';

import { PromiseQueue } from '@/lib/promise-queue';

const mutationsQueue = new PromiseQueue();

type MutationState = {
  saving: boolean;
  enqueueMutation: <TData = unknown, TError = unknown, TVariables = void>(
    mutation: UseMutationResult<TData, TError, TVariables>,
    variables: TVariables,
  ) => Promise<TData>;
};

export const useSequentialMutationsStore = create<MutationState>((set) => ({
  saving: false,
  enqueueMutation: async <TData, TError, TVariables>(
    mutation: UseMutationResult<TData, TError, TVariables>,
    variables: TVariables,
  ): Promise<TData> => {
    const executeMutation = () =>
      mutation
        .mutateAsync(variables)
        .then((result) => {
          set({ saving: mutationsQueue.size() !== 0 });
          return result;
        })
        .catch((error) => {
          console.error(error);
          mutationsQueue.halt();
          throw error;
        });

    set({ saving: true });
    return new Promise((resolve, reject) => {
      mutationsQueue.add(async () => {
        try {
          const result = await executeMutation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  },
}));
