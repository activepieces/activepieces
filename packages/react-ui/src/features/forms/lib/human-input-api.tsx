import semVer from 'semver';

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
  submitForm: async (
    formResult: FormResponse,
    useDraft: boolean,
    data: unknown,
  ) => {
    const processedData = await processData(
      data as Record<string, unknown>,
      formResult,
    );
    const suffix = getSuffix(
      useDraft ? 'draft' : 'locked',
      formResult.props.waitForResponse,
    );
    return api.post<HumanInputFormResult | null>(
      `/v1/webhooks/${formResult.id}${suffix}`,
      processedData,
      undefined,
      {
        'Content-Type':
          processedData instanceof FormData
            ? 'multipart/form-data'
            : 'application/json',
      },
    );
  },
  sendMessage: async ({
    flowId,
    chatId,
    message,
    files,
    mode,
  }: SendMessageParams) => {
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('message', message);
    files.forEach((file, index) => {
      formData.append(`file[${index}]`, file);
    });
    const suffix = getSuffix(mode, true);
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

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => {
      reject(reader.error);
    };
  });
};

async function processData(
  data: Record<string, unknown>,
  formResult: FormResponse,
) {
  const useFormData = semVer.gte(formResult.version, '0.4.1');
  const formData = new FormData();
  const processedData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (useFormData) {
      formData.append(key, value instanceof File ? value : String(value));
    } else {
      processedData[key] =
        value instanceof File ? await fileToBase64(value) : value;
    }
  }
  return useFormData ? formData : processedData;
}

function getSuffix(
  mode: 'draft' | 'locked' | 'test',
  waitForResponse: boolean,
): string {
  if (mode === 'test') {
    return '/test';
  }
  if (mode === 'draft') {
    return waitForResponse ? '/draft/sync' : '/draft';
  }
  return waitForResponse ? '/sync' : '';
}

type SendMessageParams = {
  flowId: string;
  chatId: string;
  message: string;
  files: File[];
  mode: 'draft' | 'locked' | 'test';
};
