import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { EmailitApiError, emailitClient } from './common/client';

export const emailitAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Get your API key from your [Emailit Workspace Settings](https://app.emailit.com/settings/api-keys). A **Full Access** key works with every action. A **Sending Only** key can send, reschedule, cancel, retry and forward emails, but not read emails or manage domains, audiences, contacts or suppressions.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await emailitClient.request({ auth, method: HttpMethod.GET, path: '/domains', query: { limit: 1 } });
      return { valid: true };
    } catch (error) {
      if (error instanceof EmailitApiError && error.status === 401) {
        return { valid: false, error: 'Invalid API key. Please check your Emailit Workspace Settings.' };
      }
      if (error instanceof EmailitApiError && error.status === 403 && isScopeDenied(error.responseBody)) {
        return { valid: true };
      }
      return {
        valid: false,
        error: error instanceof Error ? `Could not reach Emailit to check the key: ${error.message}` : 'Could not reach Emailit to check the key.',
      };
    }
  },
});

function isScopeDenied(body: unknown): boolean {
  if (body === null || typeof body !== 'object') return false;
  const message = Reflect.get(body, 'message');
  return typeof message === 'string' && message.toLowerCase().includes('permission denied');
}
