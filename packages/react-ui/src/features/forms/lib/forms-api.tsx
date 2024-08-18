import { t } from 'i18next';

import { api } from '@/lib/api';
import { FormResponse, USE_DRAFT_QUERY_PARAM_NAME } from '@activepieces/shared';

export const formsApi = {
  get: (flowId: string, useDraft?: boolean) => {
    return api.get<FormResponse>(`/v1/forms/${flowId}`, {
      [USE_DRAFT_QUERY_PARAM_NAME]: useDraft ?? false,
    });
  },
  submitForm: (formResult: FormResponse, useDraft: boolean, data: unknown) => {
    const suffix = useDraft
      ? '/test'
      : formResult.props.waitForResponse
      ? '/sync'
      : '';
    return api.post<FormResult | null>(
      `/v1/webhooks/${formResult.id}${suffix}`,
      data,
    );
  },
};

export type FormResult = {
  type: FormResultTypes;
  value: unknown;
};

export enum FormResultTypes {
  MARKDOWN = t('markdown'),
  FILE = t('file'),
}
