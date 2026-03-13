import { FormResponse, HumanInputFormResult } from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

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

export const formsMutations = {
  useSubmitForm: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (result: HumanInputFormResult | null) => void;
    onError: (error: Error) => void;
  }) => {
    return useMutation<
      HumanInputFormResult | null,
      Error,
      { form: FormResponse; useDraft: boolean; data: Record<string, unknown> }
    >({
      mutationFn: ({ form, useDraft, data }) =>
        humanInputApi.submitForm(form, useDraft, data),
      onSuccess,
      onError,
    });
  },
};
