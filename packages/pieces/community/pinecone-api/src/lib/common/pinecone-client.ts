import { Pinecone, type PineconeConfiguration } from '@pinecone-database/pinecone';
import { Dispatcher, ProxyAgent } from 'undici';
import * as fs from 'fs';

export interface PineconeAuthConfig {
  apiKey: string;
  useProxy?: boolean;
  proxyUrl?: string;
  proxyPort?: number;
  proxyHost?: string;
  proxyCertPath?: string;
}

/**
 * Initialize a Pinecone client with the provided configuration
 * Following Pinecone documentation: "Initialize a client object with your API key 
 * and then reuse the authenticated client in subsequent function calls"
 * Supports optional proxy configuration for enterprise environments
 */
export function createPineconeClient(authConfig: PineconeAuthConfig): Pinecone {
  if (!authConfig.apiKey) {
    throw new Error('Pinecone API key is required. Please provide a valid API key from your Pinecone console.');
  }

  const config: PineconeConfiguration = {
    apiKey: authConfig.apiKey,
  };

  // Add proxy configuration if enabled
  if (authConfig.useProxy && authConfig.proxyUrl && authConfig.proxyPort && authConfig.proxyHost) {
    try {
      // Read certificate if path is provided
      let cert: Buffer | undefined;
      if (authConfig.proxyCertPath) {
        try {
          cert = fs.readFileSync(authConfig.proxyCertPath);
        } catch (error) {
          console.warn(`Warning: Could not read proxy certificate from ${authConfig.proxyCertPath}:`, error);
        }
      }

      // Create proxy agent
      const proxyAgent = new ProxyAgent({
        uri: authConfig.proxyUrl,
        requestTls: {
          port: authConfig.proxyPort,
          host: authConfig.proxyHost,
          ...(cert && { ca: cert }),
        },
      });

      // Create custom fetch function with proxy
      const customFetch = (input: string | URL | Request, init?: RequestInit) => {
        const fetchOptions: any = {
          ...init,
          dispatcher: proxyAgent as Dispatcher,
          keepalive: true,
        };
        return fetch(input, fetchOptions);
      };

      config.fetchApi = customFetch;
    } catch (error) {
      throw new Error(`Failed to configure proxy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return new Pinecone(config);
}

/**
 * Validate that the API key is properly formatted
 */
export function validateApiKey(apiKey: string): void {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Invalid API key: API key must be a non-empty string');
  }
  
  if (apiKey.length < 10) {
    throw new Error('Invalid API key: API key appears to be too short');
  }
}

/**
 * Create Pinecone client from auth object (for backward compatibility)
 */
export function createPineconeClientFromAuth(auth: any): Pinecone {
  // Handle both old string format and new object format
  if (typeof auth === 'string') {
    return createPineconeClient({ apiKey: auth });
  }
  
  // Debug logging to understand the auth structure
  console.log('Auth object received:', JSON.stringify(auth, null, 2));
  console.log('Auth type:', typeof auth);
  
  // Handle the case where auth might be nested in a props object
  let actualAuth = auth;
  if (auth && auth.props) {
    actualAuth = auth.props;
    console.log('Using auth.props:', JSON.stringify(actualAuth, null, 2));
  }
  
  if (!actualAuth || !actualAuth.apiKey) {
    throw new Error('Invalid authentication: API key is required');
  }
  
  return createPineconeClient({
    apiKey: actualAuth.apiKey,
    useProxy: actualAuth.useProxy,
    proxyUrl: actualAuth.proxyUrl,
    proxyPort: actualAuth.proxyPort,
    proxyHost: actualAuth.proxyHost,
    proxyCertPath: actualAuth.proxyCertPath,
  });
}