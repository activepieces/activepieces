import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export type VerifyEmailMode = 'power' | 'quick';

export const verifySingleEmail = (
  email: string,
  mode: string,
  apiKey: string
) => {
  return httpClient.sendRequest({
    method: HttpMethod.GET,
    url: 'https://emailverifier.reoon.com/api/v1/verify',
    queryParams: { email, key: apiKey, mode },
  });
};

export const splitEmails = (emails: unknown[]): string[] => {
  return emails
    .flatMap((item) => String(item).split(','))
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
};

export const verifyEmails = (
  emails: string[],
  taskName: string,
  apiKey: string
) => {
  return httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `https://emailverifier.reoon.com/api/v1/create-bulk-verification-task`,
    body: {
      name: taskName,
      emails,
      key: apiKey,
    },
  });
};

export async function verifyEmailsResult(taskId: string, apiKey: string) {
  return await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: 'https://emailverifier.reoon.com/api/v1/get-result-bulk-verification-task',
    queryParams: {
      key: apiKey,
      task_id: taskId,
    },
  });
}
