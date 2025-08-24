import { Pinecone } from '@pinecone-database/pinecone';

/**
 * Initialize a Pinecone client with the provided API key
 * Following Pinecone documentation: "Initialize a client object with your API key 
 * and then reuse the authenticated client in subsequent function calls"
 */
export function createPineconeClient(apiKey: string): Pinecone {
  if (!apiKey) {
    throw new Error('Pinecone API key is required. Please provide a valid API key from your Pinecone console.');
  }

  return new Pinecone({
    apiKey: apiKey,
  });
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