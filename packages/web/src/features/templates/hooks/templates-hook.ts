import { Template, TemplateType } from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';

import { templatesApi } from '../api/templates-api';

export const templatesHooks = {
  useTemplateCategories: () => {
    return useQuery<string[], Error>({
      queryKey: ['template', 'categories'],
      queryFn: async () => {
        const result = await templatesApi.getCategories();
        return (result?.value ?? []) as string[];
      },
      staleTime: 5 * 60 * 1000,
    });
  },

  useTemplate: (id: string) => {
    return useQuery<Template, Error>({
      queryKey: ['template', id],
      queryFn: () => templatesApi.getTemplate(id),
    });
  },

  useAllOfficialTemplates: () => {
    return useQuery<Template[], Error>({
      queryKey: ['templates', 'all'],
      queryFn: async () => {
        const result = await templatesApi.list({
          type: TemplateType.OFFICIAL,
        });
        return result.data;
      },
      staleTime: 5 * 60 * 1000,
      meta: { showErrorDialog: true },
    });
  },

  useTemplates: (type?: TemplateType) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get('search') ?? '';
    const category = searchParams.get('category') ?? undefined;

    const [debouncedSearch] = useDebounce(search, 300);

    const { data: templates, isLoading } = useQuery<Template[], Error>({
      queryKey: ['templates', debouncedSearch, category],
      queryFn: async () => {
        const templates = await templatesApi.list({
          type,
          search: debouncedSearch || undefined,
          category,
        });
        return templates.data;
      },
      staleTime: 5 * 60 * 1000,
      meta: { showErrorDialog: true },
    });

    const setSearch = (newSearch: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (newSearch) {
          params.set('search', newSearch);
        } else {
          params.delete('search');
        }
        return params;
      });
    };

    const setCategory = (newCategory: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (newCategory && newCategory !== 'All') {
          params.set('category', newCategory);
        } else {
          params.delete('category');
        }
        return params;
      });
    };

    return {
      templates,
      isLoading,
      search,
      setSearch,
      category: category || 'All',
      setCategory,
    };
  },
};

export const templateKeys = {
  all: ['templates'] as const,
  custom: ['custom-templates'] as const,
};

export const templatesMutations = {
  useCreateTemplate: ({
    onDone,
    onError,
  }: {
    onDone: () => void;
    onError?: (error: Error) => void;
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (request: Parameters<typeof templatesApi.create>[0]) =>
        templatesApi.create(request),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: templateKeys.custom });
        toast.success(t('Template created successfully'), { duration: 3000 });
        onDone();
      },
      onError,
    });
  },
  useUpdateTemplate: ({
    onDone,
    onError,
  }: {
    onDone: () => void;
    onError?: (error: Error) => void;
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({
        templateId,
        request,
      }: {
        templateId: string;
        request: Parameters<typeof templatesApi.update>[1];
      }) => templatesApi.update(templateId, request),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: templateKeys.custom });
        toast.success(t('Template updated successfully'), { duration: 3000 });
        onDone();
      },
      onError,
    });
  },
  useBulkDeleteTemplates: ({ onSuccess }: { onSuccess: () => void }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (templateIds: string[]) => {
        await Promise.all(templateIds.map((id) => templatesApi.delete(id)));
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: templateKeys.custom });
        onSuccess();
      },
    });
  },
};
