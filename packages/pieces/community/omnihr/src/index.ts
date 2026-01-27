import {
  PieceAuth,
  createPiece,
  Property,
} from '@activepieces/pieces-framework';
import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { getEmployeeSystemId } from './lib/actions/get-employee-system-id';
import { getEmployeeInfo } from './lib/actions/get-employee-info';
import { getEmployeeOrganizationalChart } from './lib/actions/get-employee-organizational-chart';
import { getDirectReports } from './lib/actions/get-direct-reports';

const OMNIHR_API_BASE_URL = 'https://api.omnihr.co/api/';
const OMNIHR_TOKEN_URL = 'https://api.omnihr.co/api/v1/auth/token/';
const markdown = 'Enter your OmniHR credentials to authenticate:';

async function getAccessToken(
  username: string,
  password: string,
  origin: string
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Origin: origin,
  };

  const response = await httpClient.sendRequest<{
    access: string;
    refresh: string;
    access_exp?: string;
    refresh_exp?: string;
  }>({
    method: HttpMethod.POST,
    url: OMNIHR_TOKEN_URL,
    headers,
    body: {
      username,
      password,
    },
  });

  if (!response.body.access) {
    throw new Error('Failed to obtain access token.');
  }

  return response.body.access;
}

export const omnihrAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Your OmniHR email address',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Your OmniHR password',
      required: true,
    }),
    origin: Property.ShortText({
      displayName: 'Origin',
      description: 'Your OmniHR origin URL',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const { username, password, origin } = auth;
      await getAccessToken(username, password, origin);
      return {
        valid: true,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: `Authentication failed: ${
          error.message || 'Invalid credentials'
        }`,
      };
    }
  },
});

export const omnihr = createPiece({
  displayName: 'Omni HR',
  description:
    'Smart, all-in-one HR platform for managing employees, time tracking, and HR workflows',
  auth: omnihrAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/omnihr.png',
  authors: ['arinmak'],
  categories: [PieceCategory.HUMAN_RESOURCES],
  actions: [
    getEmployeeSystemId,
    getEmployeeInfo,
    getEmployeeOrganizationalChart,
    getDirectReports,
    createCustomApiCallAction({
      baseUrl: () => OMNIHR_API_BASE_URL,
      auth: omnihrAuth,
      authMapping: async (auth: any) => {
        const { username, password, origin } = auth.props;
        const accessToken = await getAccessToken(username, password, origin);
        const headers: Record<string, string> = {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        };

        if (origin) {
          headers['Origin'] = origin;
        }

        return headers;
      },
    }),
  ],
  triggers: [],
});
