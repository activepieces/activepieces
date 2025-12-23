import { useQueries } from '@tanstack/react-query';
import { useState } from 'react';

import { ListTemplatesRequestQuery } from '@activepieces/shared';

import { templatesApi } from '../lib/templates-api';

export const useTemplates = (request: ListTemplatesRequestQuery) => {
  const [search, setSearch] = useState<string>('');

  // Fetch community, cloud, and user templates
  const queries = useQueries({
    queries: [
      {
        queryKey: ['templates'],
        queryFn: async () => {
          const result = await templatesApi.list(request);
          return result.data;
        },
        staleTime: 0, // Always fetch when needed
      },
      {
        queryKey: ['cloud-templates'],
        queryFn: async () => {
          const result = await templatesApi.listCloud(request);
          return result.data;
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
      },
      {
        queryKey: ['community-templates'],
        queryFn: async () => {
          const result = await templatesApi.listCommunity(request);
          return result.data;
        },
        staleTime: 1000 * 60 * 10, // Cache for 10 minutes
      },
    ],
  });

  const templates = [
    ...(queries[0].data ?? []),
    ...(queries[1].data ?? []),
    ...(queries[2].data ?? []),
  ];

  // Filter templates based on search
  const filteredTemplates = templates.filter((template) => {
    const templateName = template.name.toLowerCase();
    const templateDescription = template.description.toLowerCase();
    return (
      templateName.includes(search.toLowerCase()) ||
      templateDescription.includes(search.toLowerCase())
    );
  });

  return {
    templates,
    filteredTemplates,
    isLoading: queries.every((query) => query.isFetching), // True only if any query is still fetching
    search,
    setSearch,
  };
};
