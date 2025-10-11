import {
  PieceAuth,
  Property,
  ShortTextProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const servicenowAuth = PieceAuth.CustomAuth({
  description: `
You can get your ServiceNow credentials from:
1. **Instance URL**: Your ServiceNow instance URL (e.g., https://your-instance.service-now.com)
2. **Username**: Your ServiceNow username
3. **Password**: Your ServiceNow password or API key

For API access, ensure your user has the 'snc_platform_rest_api_access' role.
    `,
  required: true,
  props: {
    instanceUrl: Property.ShortText({
      displayName: 'Instance URL',
      description: 'Your ServiceNow instance URL (e.g., https://your-instance.service-now.com)',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Your ServiceNow username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Your ServiceNow password or API key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await propsValidation.validateZod(auth, {
        instanceUrl: z.string().url(),
        username: z.string().min(1),
      });

      // Test the connection by making a simple API call
      const response = await fetch(`${auth.instanceUrl}/api/now/table/sys_user?sysparm_limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        valid: true,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Invalid credentials';
      return {
        valid: false,
        error: message,
      };
    }
  },
});

export type ServiceNowAuth = {
  instanceUrl: string;
  username: string;
  password: string;
};
