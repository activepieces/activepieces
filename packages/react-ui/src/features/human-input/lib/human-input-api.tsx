import { api } from '@/lib/api';
import { FileResponseInterface, FormResponse, USE_DRAFT_QUERY_PARAM_NAME } from '@activepieces/shared';

export const humanInputApi = {
  get: (flowId: string, useDraft?: boolean) => {
    return api.get<FormResponse>(`/v1/forms/${flowId}`, {
      [USE_DRAFT_QUERY_PARAM_NAME]: useDraft ?? false,
    });
  },
  submitForm: (formResult: FormResponse, useDraft: boolean, data: unknown) => {
    const suffix = useDraft
      ? formResult.props.waitForResponse
        ? '/draft/sync'
        : '/draft/async'
      : formResult.props.waitForResponse
        ? '/sync'
        : '';
    return api.post<FormResult | null>(
      `/v1/webhooks/${formResult.id}${suffix}`,
      data,
    );
  },
  sendMessage: ({ flowId, chatId, message, useDraft }: SendMessageParams) => {
    const suffix = useDraft ? '/draft/sync' : '/sync';
    return api.post<FormResult | null>(`/v1/webhooks/${flowId}${suffix}`, {
      chatId,
      message,
    });
  },
};

type SendMessageParams = {
  flowId: string;
  chatId: string;
  message: string;
  useDraft: boolean;
};

export type FormResult = {
  type: FormResultTypes.FILE;
  value: FileResponseInterface;
} | {
  type: FormResultTypes.MARKDOWN;
  value: string;
};

export enum FormResultTypes {
  MARKDOWN = 'markdown',
  FILE = 'file',
}
