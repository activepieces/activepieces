import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';

export const deleteAppUser = createAction({
  auth: SoftrAuth,
  name: 'deleteAppUser',
  displayName: 'Delete App User',
  description: 'Deletes a user from a Softr app.',
  audience: 'both',
  aiMetadata: { description: 'Permanently removes an end-user from a Softr app, identified by the app domain/subdomain and the user email. Use to deprovision a known user. Idempotent in effect on a stable email — once the user is gone the account stays gone — though a repeat call returns a not-found error.', idempotent: true },
  props: {
    email: Property.ShortText({
      displayName: 'User Email',
      description: 'The email address of the user to delete.',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Softr Domain',
      description: 'The domain or subdomain of the Softr app (e.g., yourdomain.com or subdomain.softr.app).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { email, domain } = propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://studio-api.softr.io/v1/api/users/${encodeURIComponent(email)}`,
        headers: {
          'Softr-Api-Key': auth.secret_text,
          'Softr-Domain': domain,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        message: `User ${email} deleted successfully from ${domain}`,
        statusCode: response.status,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`User with email ${email} not found in app ${domain}`);
      } else if (error.response?.status === 403) {
        throw new Error(`Access denied. Check your API key and domain permissions`);
      } else {
        throw new Error(`Failed to delete user: ${error.message || String(error)}`);
      }
    }
  },
});