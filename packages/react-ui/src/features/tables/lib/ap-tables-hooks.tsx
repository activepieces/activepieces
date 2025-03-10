import {
  QueryClient,
  useInfiniteQuery,
  useMutation,
  UseMutationResult,
  useQuery,
} from '@tanstack/react-query';
import { Location, useSearchParams } from 'react-router-dom';
import { create } from 'zustand';

import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { PromiseQueue } from '@/lib/promise-queue';
import {
  CreateFieldRequest,
  Field,
  FilterOperator,
  PopulatedRecord,
  SeekPage,
  Table,
  UpdateRecordRequest,
  UpdateTableRequest,
} from '@activepieces/shared';

import { fieldsApi } from './fields-api';
import { recordsApi } from './records-api';
import { tablesApi } from './tables-api';
import { RowHeight } from './types';

export type TableState = {
  isSaving: boolean;
  enqueueMutation: <TData = unknown, TError = unknown, TVariables = void>(
    mutation: UseMutationResult<TData, TError, TVariables>,
    variables: TVariables,
  ) => Promise<TData>;
  rowHeight: RowHeight;
  setRowHeight: (rowHeight: RowHeight) => void;
  selectedRows: ReadonlySet<string>;
  setSelectedRows: (selectedRows: ReadonlySet<string>) => void;
  selectedCell: {
    rowIdx: number;
    columnIdx: number;
  } | null;
  setSelectedCell: (selectedCell: { rowIdx: number; columnIdx: number } | null) => void;
};

export const tableHooks = {
  useFetchTable: (tableId: string | undefined) => {
    return useQuery({
      queryKey: ['table', tableId],
      queryFn: () => tablesApi.getById(tableId!),
    });
  },
  useFetchRecords: ({
    location,
    tableId,
  }: {
    location: Location;
    tableId: string;
  }) => {
    const [searchParams] = useSearchParams(location.search);
    return useInfiniteQuery<SeekPage<PopulatedRecord>>({
      queryKey: ['records', tableId, location.search],
      queryFn: async ({ pageParam }) => {
     
        const filters = searchParams.getAll('filter').map((f) => {
          const [fieldId, operator, value] = f.split(':');
          return {
            fieldId,
            operator: operator as FilterOperator,
            value: decodeURIComponent(value),
          };
        });
        const records = await recordsApi.list({
          tableId: tableId!,
          cursor: pageParam as string | undefined,
          limit: 200,
          filters: filters.length > 0 ? filters : undefined,
        });
        console.log(records);
        return records;
      },
      refetchOnWindowFocus: false,
      getNextPageParam: (lastPage) => lastPage.next,
      initialPageParam: undefined as string | undefined,
    });
  },
  useFetchFields: (tableId: string) => {
    return useQuery({
      queryKey: ['fields', tableId],
      queryFn: () => fieldsApi.list(tableId),
      refetchOnWindowFocus: false,
    });
  },
  createApTableStore: () => {
    return create<TableState>((set) => ({
      isSaving: false,
      rowHeight: RowHeight.DEFAULT,
      setRowHeight: (rowHeight: RowHeight) => set({ rowHeight }),
      selectedRows: new Set(),
      setSelectedRows: (selectedRows: ReadonlySet<string>) =>
        set({ selectedRows }),
      selectedCell: null,
      setSelectedCell: (selectedCell: { rowIdx: number; columnIdx: number } | null) =>
        set({ selectedCell }),
      enqueueMutation: async <TData, TError, TVariables>(
        mutation: UseMutationResult<TData, TError, TVariables>,
        variables: TVariables,
      ): Promise<TData> => {
        const mutationsQueue = new PromiseQueue();
        const executeMutation = () =>
          mutation
            .mutateAsync(variables)
            .then((result) => {
              set({ isSaving: mutationsQueue.size() !== 0 });
              return result;
            })
            .catch((error) => {
              console.error(error);
              mutationsQueue.halt();
              throw error;
            });
        set({ isSaving: true });
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
  },

  useUpdateRecord: ({
    queryClient,
    tableId,
    location,
  }: {
    queryClient: QueryClient;
    tableId: string;
    location: Location;
  }) => {
    return useMutation({
      mutationKey: ['updateRecord'],
      mutationFn: async ({
        recordId,
        request,
      }: {
        recordId: string;
        request: UpdateRecordRequest;
      }) => {
        return recordsApi.update(recordId, request);
      },
      onMutate: async ({ recordId, request }) => {
        await queryClient.cancelQueries({
          queryKey: ['records', tableId, location.search],
        });
        const previousRecords = queryClient.getQueryData([
          'records',
          tableId,
          location.search,
        ]);

        // Update the cache optimistically
        queryClient.setQueryData(
          ['records', tableId, location.search],
          (old: { pages: { data: PopulatedRecord[] }[] }) => ({
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((record) =>
                record.id !== recordId
                  ? record
                  : {
                      ...record,
                      cells: record.cells.map((cell) => {
                        const update = request.cells?.find(
                          (c) => c.key === cell.fieldId,
                        );
                        return update ? { ...cell, value: update.value } : cell;
                      }),
                    },
              ),
            })),
          }),
        );

        return { previousRecords };
      },
      onError: (error, variables, context) => {
        if (context?.previousRecords) {
          queryClient.setQueryData(
            ['records', tableId, location.search],
            context.previousRecords,
          );
        }
        toast(INTERNAL_ERROR_TOAST);
      },
      onSuccess: (data, { recordId }) => {
        // Update the cache with the server response
        queryClient.setQueryData(
          ['records', tableId, location.search],
          (old: { pages: { data: PopulatedRecord[] }[] }) => ({
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((record) =>
                record.id === recordId ? data : record,
              ),
            })),
          }),
        );
      },
    });
  },
  useDeleteField: ({
    queryClient,
    tableId,
  }: {
    queryClient: QueryClient;
    tableId: string;
  }) => {
    return useMutation({
      mutationKey: ['deleteField'],
      mutationFn: (fieldId: string) => {
        return fieldsApi.delete(fieldId);
      },
      onMutate: async (fieldId) => {
        await queryClient.cancelQueries({ queryKey: ['fields', tableId] });
        const previousFields = queryClient.getQueryData(['fields', tableId]);

        queryClient.setQueryData(
          ['fields', tableId],
          (old: Field[] | undefined) =>
            old ? old.filter((field) => field.id !== fieldId) : [],
        );

        return { previousFields };
      },
      onError: (error, __, context) => {
        console.error(error);
        if (context?.previousFields) {
          queryClient.setQueryData(['fields', tableId], context.previousFields);
        }
        toast(INTERNAL_ERROR_TOAST);
      },
    });
  },
  useDeleteRecords: ({
    onSuccess,
    queryClient,
    tableId,
    location,
  }: {
    onSuccess: () => void;
    queryClient: QueryClient;
    tableId: string;
    location: Location;
  }) => {
    return useMutation({
      mutationKey: ['deleteRecords'],
      mutationFn: async (recordIds: string[]) => {
        await recordsApi.delete({ ids: recordIds });
      },
      onMutate: async (recordIds) => {
        await queryClient.cancelQueries({
          queryKey: ['records', tableId, location.search],
        });
        const previousRecords = queryClient.getQueryData([
          'records',
          tableId,
          location.search,
        ]);

        // Update the cache optimistically
        queryClient.setQueryData(
          ['records', tableId, location.search],
          (old: { pages: { data: PopulatedRecord[] }[] }) => ({
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter(
                (record) => !recordIds.includes(record.id),
              ),
            })),
          }),
        );

        return { previousRecords };
      },
      onError: (error, __, context) => {
        console.error(error);
        if (context?.previousRecords) {
          queryClient.setQueryData(
            ['records', tableId, location.search],
            context.previousRecords,
          );
        }
        toast(INTERNAL_ERROR_TOAST);
      },
      onSuccess,
    });
  },
  useCreateRecord: ({
    queryClient,
    tableId,
    location,
  }: {
    queryClient: QueryClient;
    tableId: string;
    location: Location;
  }) => {
    return useMutation({
      mutationKey: ['createRecord'],
      mutationFn: async ({
        field,
        value,
      }: {
        field: Field;
        value: string;
        tempId: string;
      }) => {
        return recordsApi.create({
          records: [
            [
              {
                key: field.name,
                value: value,
              },
            ],
          ],
          tableId: tableId!,
        });
      },
      onMutate: async ({ tempId }) => {
        await queryClient.cancelQueries({
          queryKey: ['records', tableId, location.search],
        });
        const previousRecords = queryClient.getQueryData([
          'records',
          tableId,
          location.search,
        ]);

        return { previousRecords, tempId };
      },
      onError: (_, __, context) => {
        if (context?.previousRecords) {
          // Restore the previous records and remove the temporary record
          queryClient.setQueryData(
            ['records', tableId, location.search],
            context.previousRecords,
          );
        }
        toast(INTERNAL_ERROR_TOAST);
      },
      onSuccess: (data, { tempId }) => {
        // Replace the temporary record with the real one
        queryClient.setQueryData(
          ['records', tableId, location.search],
          (old: { pages: { data: PopulatedRecord[] }[] }) => ({
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((record) =>
                record.id === tempId ? data[0] : record,
              ),
            })),
          }),
        );
      },
    });
  },
  useCreateField: ({
    queryClient,
    tableId,
  }: {
    queryClient: QueryClient;
    tableId: string;
  }) => {
    return useMutation({
      mutationFn: async (request: CreateFieldRequest) => {
        return fieldsApi.create(request);
      },
      onMutate: async (data) => {
        await queryClient.cancelQueries({ queryKey: ['fields', tableId] });
        const previousFields = queryClient.getQueryData(['fields', tableId]);

        // Create an optimistic field
        const optimisticField: Field = {
          id: 'temp-' + Date.now(),
          name: data.name,
          type: data.type,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          tableId,
          projectId: '',
        };

        queryClient.setQueryData(['fields', tableId], (old: Field[]) => [
          ...(old || []),
          optimisticField,
        ]);

        return { previousFields, optimisticField };
      },
      onError: (_, __, context) => {
        if (context?.previousFields) {
          queryClient.setQueryData(['fields', tableId], context.previousFields);
        }
        toast(INTERNAL_ERROR_TOAST);
      },
      onSettled: (data, error, variables, context) => {
        if (data && context?.optimisticField) {
          // Replace the optimistic field with the real one
          queryClient.setQueryData(['fields', tableId], (old: Field[]) =>
            old.map((field: Field) =>
              field.id === context.optimisticField.id ? data : field,
            ),
          );
        }
      },
    });
  },
  useUpdateTable: ({
    queryClient,
    tableId,
    onSuccess,
  }: {
    queryClient: QueryClient;
    tableId: string;
    onSuccess?: () => void;
  }) => {
    return useMutation({
      mutationFn: (request: UpdateTableRequest) => {
        queryClient.setQueryData(['table', tableId], (old: Table) => ({
          ...old,
          name: request.name,
        }));
        return tablesApi.update(tableId, request);
      },
      onSuccess,
    });
  },
};

export type ApTableStore = ReturnType<typeof tableHooks.createApTableStore>;
