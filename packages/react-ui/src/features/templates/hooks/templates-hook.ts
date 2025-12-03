import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { ListTemplatesRequestQuery, Template } from '@activepieces/shared';

import { templatesApi } from '../lib/templates-api';

export const useTemplates = (request: ListTemplatesRequestQuery) => {
  const [search, setSearch] = useState<string>('');

  const { data: templates, isLoading } = useQuery<Template[], Error>({
    queryKey: ['templates'],
    queryFn: async () => {
      const templates = await templatesApi.list(request);
      return templates.data;
    },
    staleTime: 0,
  });

  const filteredTemplates = templates?.filter((template) => {
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
    isLoading,
    search,
    setSearch,
  };
};
