import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cyberarkAuth } from '../..';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
  
export interface CyberArkAuth {
  serverUrl: string;
  username: string;
  password: string;
}

export interface AuthToken {
  token: string;
  serverUrl: string;
}

export async function getAuthToken(auth: AppConnectionValueForAuthProperty<typeof cyberarkAuth>): Promise<AuthToken> {
  const baseUrl = auth.props.serverUrl.replace(/\/$/, '');
  
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/PasswordVault/API/auth/Cyberark/Logon/`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        username: auth.props.username,
        password: auth.props.password,
      },
    });

    if (response.status === 200 && response.body) {
      let token = response.body;
      if (typeof token === 'string') {
        token = token.replace(/^["']|["']$/g, '').trim();
      }
      
      if (typeof token === 'string' && token.length > 0) {
        return {
          token: token,
          serverUrl: baseUrl,
        };
      } else {
        throw new Error('Invalid token received from authentication');
      }
    } else {
      throw new Error(`Authentication failed with status: ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to authenticate: ${error.message}`);
    } else {
      throw new Error(`Failed to authenticate: ${String(error)}`);
    }
  }
}