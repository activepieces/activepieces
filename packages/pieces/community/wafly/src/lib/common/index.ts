import { PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

/**
 * The four fields as configured in the connection. Note that a CustomAuth
 * connection hands them over nested under `.props`, never at the top level.
 */
export type WaflyCredentials = {
  baseUrl: string;
  clientToken: string;
  instance: string;
  token: string;
};

export type WaflyAuthValue = { props: WaflyCredentials };

export const waflyAuth = PieceAuth.CustomAuth({
  description: `Get these from the Wafly dashboard at https://wafly.com.br — **Client Token** lives under Security, and **Instance** and **Token** under the instance you want to use.`,
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'Leave the default unless you run a dedicated Wafly host.',
      required: true,
      defaultValue: 'https://wafly.com.br/api-bridge-whats',
    }),
    clientToken: PieceAuth.SecretText({
      displayName: 'Client Token',
      description: 'Account-wide token, sent as the Client-Token header.',
      required: true,
    }),
    instance: Property.ShortText({
      displayName: 'Instance',
      description: 'Name of the WhatsApp instance.',
      required: true,
    }),
    token: PieceAuth.SecretText({
      displayName: 'Instance Token',
      description: 'Token of that specific instance.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      // Asymmetry in the framework worth knowing about: `validate` receives the
      // connection fields flat, while `run` receives them nested under `.props`.
      // Wrapping here keeps waflyApiCall with a single shape to reason about.
      await waflyApiCall({
        auth: { props: auth },
        method: HttpMethod.GET,
        resourceUri: '/status',
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Could not reach the instance. Check the Client Token, instance name and instance token.',
      };
    }
  },
});

/**
 * Every instance-scoped Wafly route lives under
 * /instances/{instance}/token/{token}, with the account-wide Client-Token in
 * the header. Keeping the URL assembly here means no action can accidentally
 * leak the instance token into a log line or an error message.
 */
export async function waflyApiCall<T extends HttpMessageBody>({
  auth,
  method,
  resourceUri,
  body,
  queryParams,
}: {
  auth: WaflyAuthValue;
  method: HttpMethod;
  resourceUri: string;
  body?: unknown;
  queryParams?: QueryParams;
}): Promise<T> {
  const { baseUrl, instance, token, clientToken } = auth.props;
  const root = baseUrl.replace(/\/$/, '');
  const basePath = `/instances/${encodeURIComponent(
    instance
  )}/token/${encodeURIComponent(token)}`;

  const response = await httpClient.sendRequest<T>({
    method,
    url: `${root}${basePath}${resourceUri}`,
    headers: {
      'Client-Token': clientToken,
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });

  return response.body;
}

/**
 * Wafly wants a plain international number (e.g. 5511999999999), so a pasted
 * "+55 (11) 99999-9999" is cleaned up. Group IDs also travel in this field and
 * are NOT numbers — "120363...@g.us" would be mangled into digits and silently
 * addressed to the wrong chat, so anything carrying an @ or a - is left alone.
 */
export function normalizePhone(recipient: string): string {
  const value = recipient.trim();
  if (value.includes('@') || value.includes('-')) {
    return value;
  }
  return value.replace(/\D/g, '');
}
