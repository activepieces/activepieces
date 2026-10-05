import { SeekPage } from '@activepieces/core-utils';
import { Template, TemplateStatus, TemplateType } from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';

import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import {
  MUTATION_ERROR_TOAST_ID,
  mutationFeedback,
} from '@/lib/mutation-feedback';

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
  platformCustom: ['templates', 'platform-custom'] as const,
};

export const templatesMutations = {
  useCreateTemplate: ({ onError }: { onError: (error: Error) => void }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (request: Parameters<typeof templatesApi.create>[0]) =>
        templatesApi.create(request),
      onSuccess: (template) => {
        toast.success(t('{name} created', { name: template.name }));
        return queryClient.invalidateQueries({ queryKey: templateKeys.all });
      },
      onError,
    });
  },
  useUpdateTemplate: ({ onError }: { onError: (error: Error) => void }) => {
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
        toast.success(t('Changes saved'));
        return queryClient.invalidateQueries({ queryKey: templateKeys.all });
      },
      onError,
    });
  },
  useSetTemplateStatus: () => {
    return useOptimisticMutation<
      TemplateStatusChange,
      SeekPage<Template>,
      Template
    >({
      queryKey: templateKeys.platformCustom,
      mutationFn: ({ template, status }) =>
        templatesApi.update(template.id, {
          status,
          metadata: template.metadata,
        }),
      apply: ({ current, vars }) => ({
        ...current,
        data: current.data.map((row) =>
          row.id === vars.template.id ? { ...row, status: vars.status } : row,
        ),
      }),
      invalidate: [templateKeys.all],
      success: ({ vars }) =>
        vars.status === TemplateStatus.ARCHIVED
          ? t('{name} archived', { name: vars.template.name })
          : t('{name} published', { name: vars.template.name }),
      undo: ({ vars }) => ({ ...vars, status: vars.previousStatus }),
      errorTitle: t("Couldn't change the template"),
    });
  },
  useBulkDeleteTemplates: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (templates: Template[]) => {
        const results = await Promise.allSettled(
          templates.map((template) => templatesApi.delete(template.id)),
        );
        const failed = templates.filter(
          (_template, index) => results[index].status === 'rejected',
        );
        const firstFailure = results.find(
          (result): result is PromiseRejectedResult =>
            result.status === 'rejected',
        );
        if (firstFailure && failed.length === templates.length) {
          throw firstFailure.reason;
        }
        return { deleted: templates.length - failed.length, failed };
      },
      onSuccess: ({ deleted, failed }, templates) => {
        if (failed.length > 0) {
          toast.error(
            t(
              '{deleted, plural, =1 {Deleted 1 template} other {Deleted # templates}}, but {failed, plural, =1 {1 could not be deleted} other {# could not be deleted}}',
              { deleted, failed: failed.length },
            ),
            {
              id: MUTATION_ERROR_TOAST_ID,
              description: failed.map((template) => template.name).join(', '),
            },
          );
          return;
        }
        toast.success(
          templates.length === 1
            ? t('{name} deleted', { name: templates[0].name })
            : t(
                '{count, plural, =1 {1 template deleted} other {# templates deleted}}',
                { count: deleted },
              ),
        );
      },
      onError: (error) =>
        mutationFeedback.error({
          error,
          title: t("Couldn't delete the templates"),
        }),
      onSettled: () =>
        queryClient.invalidateQueries({ queryKey: templateKeys.all }),
    });
  },
};

type TemplateStatusChange = {
  template: Template;
  status: TemplateStatus;
  previousStatus: TemplateStatus;
};
