import { api } from '@/lib/api';
import {
  ChatUIResponse,
  FileResponseInterface,
  FormResponse,
  USE_DRAFT_QUERY_PARAM_NAME,
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
  sendMessage: ({ flowId, chatId, message }: SendMessageParams) => {
    return api.post<FormResult | null>(`/v1/webhooks/${flowId}/sync`, {
      chatId,
      message,
    });
  },
};

type SendMessageParams = {
  flowId: string;
  chatId: string;
  message: string;
};

export type FormResult =
  | {
      type: FormResultTypes.FILE;
      value: FileResponseInterface;
    }
  | {
      type: FormResultTypes.MARKDOWN;
      value: string;
    };

export enum FormResultTypes {
  MARKDOWN = 'markdown',
  FILE = 'file',
}
