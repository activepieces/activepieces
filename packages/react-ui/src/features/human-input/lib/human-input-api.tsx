import { api } from '@/lib/api';
import {
  ChatUIResponse,
  FormResponse,
  USE_DRAFT_QUERY_PARAM_NAME,
  HumanInputFormResult,
} from '@activepieces/shared';

export const humanInputApi = {
  getForm: (flowId: string, useDraft?: boolean) => {
    return api.get<FormResponse>(`/v1/human-input/form/${flowId}`, {
      [USE_DRAFT_QUERY_PARAM_NAME]: useDraft ?? false,
    });
  },
  getChatUI: (flowId: string, useDraft?: boolean) => {
    return api.get<ChatUIResponse>(`/v1/human-input/chat/${flowId}`, {
      [USE_DRAFT_QUERY_PARAM_NAME]: useDraft ?? false,
    });
  },
  submitForm: (formResult: FormResponse, useDraft: boolean, data: unknown) => {
    const suffix = getSuffix(useDraft, formResult.props.waitForResponse);
    return api.post<HumanInputFormResult | null>(
      `/v1/webhooks/${formResult.id}${suffix}`,
      data,
    );
  },
  sendMessage: async ({
    flowId,
    chatId,
    message,
    files,
    useDraft,
  }: SendMessageParams) => {
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('message', message);
    files.forEach((file, index) => {
      formData.append(`file[${index}]`, file);
    });
    const suffix = getSuffix(useDraft, true);
    return api.post<HumanInputFormResult | null>(
      `/v1/webhooks/${flowId}${suffix}`,
      formData,
      undefined,
      {
        'Content-Type': 'multipart/form-data',
      },
    );
  },
};

function getSuffix(useDraft: boolean, waitForResponse: boolean): string {
  if (useDraft) {
    return waitForResponse ? '/draft/sync' : '/draft';
  }
  return waitForResponse ? '/sync' : '';
}

type SendMessageParams = {
  flowId: string;
  chatId: string;
  message: string;
  files: File[];
  useDraft: boolean;
};
