import { connect, NodeWebSocketFactory } from '@hcengineering/api-client';
import type { ConnectOptions, PlatformClient } from '@hcengineering/api-client';

export interface HulyAuthConfig {
  url: string;
  workspace: string;
  email?: string;
  password?: string;
  token?: string;
}

function createConnectOptions(auth: HulyAuthConfig): ConnectOptions {
  // Check if using email/password authentication (Method 1)
  if (auth.email && auth.password) {
    return {
      email: auth.email,
      password: auth.password,
      workspace: auth.workspace,
      socketFactory: NodeWebSocketFactory,
      connectionTimeout: 30000,
    };
  }

  // Check if using token authentication (Method 2)
  if (auth.token) {
    return {
      token: auth.token,
      workspace: auth.workspace,
      socketFactory: NodeWebSocketFactory,
      connectionTimeout: 30000,
    };
  }

  // Smart error messages based on what's provided
  if (auth.email && !auth.password) {
    throw new Error('Password is required when email is provided. Use Method 1: Email + Password authentication.');
  }

  if (auth.password && !auth.email) {
    throw new Error('Email is required when password is provided. Use Method 1: Email + Password authentication.');
  }

  throw new Error('Please choose ONE authentication method:\n• Method 1: Fill in Email + Password\n• Method 2: Fill in Token');
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
