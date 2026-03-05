import { FormResponse } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { humanInputApi } from '../api/human-input-api';

export const formsKeys = {
  form: (flowId: string) => ['form', flowId] as const,
};

export const formsQueries = {
  useForm: (flowId: string, useDraft: boolean, enabled: boolean) =>
    useQuery<FormResponse | null, Error>({
      queryKey: formsKeys.form(flowId),
      queryFn: () => humanInputApi.getForm(flowId, useDraft),
      enabled,
      retry: false,
      staleTime: Infinity,
    }),
};
