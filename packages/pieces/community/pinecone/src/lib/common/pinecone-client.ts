import { Pinecone, type PineconeConfiguration } from '@pinecone-database/pinecone';

export interface PineconeAuthConfig {
  apiKey: string;
}


export function createPineconeClient(authConfig: PineconeAuthConfig): Pinecone {
  if (!authConfig.apiKey) {
    throw new Error('Pinecone API key is required. Please provide a valid API key from your Pinecone console.');
  }

  const config: PineconeConfiguration = {
    apiKey: authConfig.apiKey,
  };

  return new Pinecone(config);
}


export function validateApiKey(apiKey: string): void {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('Invalid API key: API key must be a non-empty string');
  }
  
  if (apiKey.length < 10) {
    throw new Error('Invalid API key: API key appears to be too short');
  }
}


export function createPineconeClientFromAuth(auth: any): Pinecone {
  if (typeof auth === 'string') {
    return createPineconeClient({ apiKey: auth });
  }
  
  let actualAuth = auth;
  if (auth && auth.props) {
    actualAuth = auth.props;
  }
  
  if (!actualAuth || !actualAuth.apiKey) {
    throw new Error('Invalid authentication: API key is required');
  }
  
  return createPineconeClient({
    apiKey: actualAuth.apiKey,
  });
}