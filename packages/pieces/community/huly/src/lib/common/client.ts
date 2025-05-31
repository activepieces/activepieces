import { connect, NodeWebSocketFactory } from '@hcengineering/api-client';
import type { ConnectOptions, PlatformClient } from '@hcengineering/api-client';

export interface HulyAuthConfig {
  url: string;
  workspace: string;
  authMethod: 'emailPassword' | 'token';
  email?: string;
  password?: string;
  token?: string;
}

function createConnectOptions(auth: HulyAuthConfig): ConnectOptions {
  if (auth.authMethod === 'emailPassword') {
    if (!auth.email || !auth.password) {
      throw new Error('Email and password are required when using email/password authentication');
    }
    return {
      email: auth.email,
      password: auth.password,
      workspace: auth.workspace,
      socketFactory: NodeWebSocketFactory,
      connectionTimeout: 30000,
    };
  } else if (auth.authMethod === 'token') {
    if (!auth.token) {
      throw new Error('Token is required when using token authentication');
    }
    return {
      token: auth.token,
      workspace: auth.workspace,
      socketFactory: NodeWebSocketFactory,
      connectionTimeout: 30000,
    };
  }

  throw new Error('Invalid authentication method');
}

export async function createHulyClient(auth: HulyAuthConfig): Promise<PlatformClient> {
  const options = createConnectOptions(auth);

  try {
    return await connect(auth.url, options);
  } catch (error) {
    throw new Error(`Failed to connect to Huly: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function validateHulyConnection(auth: HulyAuthConfig): Promise<boolean> {
  try {
    const client = await createHulyClient(auth);
    await client.close();
    return true;
  } catch (error) {
    return false;
  }
}
