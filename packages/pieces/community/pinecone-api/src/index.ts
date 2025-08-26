import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createIndex } from './lib/actions/create-index';
import { upsertVector } from './lib/actions/upsert-vector';
import { updateVector } from './lib/actions/update-vector';
import { getVector } from './lib/actions/get-vector';
import { deleteVector } from './lib/actions/delete-vector';
import { searchVector } from './lib/actions/search-vector';
import { searchText } from './lib/actions/search-text';

export const pineconeAuth = PieceAuth.CustomAuth({
  description: 'Configure your Pinecone API key and optional proxy settings',
  required: true,
  props: {
    apiKey: Property.LongText({
      displayName: 'API Key',
      description: 'Enter your Pinecone API key. You can create a new API key in the Pinecone console for your target project.',
      required: true,
    }),
    useProxy: Property.Checkbox({
      displayName: 'Use Proxy',
      description: 'Enable proxy configuration for Pinecone requests',
      required: false,
      defaultValue: false,
    }),
    proxyUrl: Property.ShortText({
      displayName: 'Proxy URL',
      description: 'Proxy server URL (e.g., https://your-proxy.com)',
      required: false,
    }),
    proxyPort: Property.Number({
      displayName: 'Proxy Port',
      description: 'Proxy server port',
      required: false,
    }),
    proxyHost: Property.ShortText({
      displayName: 'Proxy Host',
      description: 'Proxy server host',
      required: false,
    }),
    proxyCertPath: Property.ShortText({
      displayName: 'Proxy Certificate Path',
      description: 'Path to proxy certificate file (e.g., path/to/mitmproxy-ca-cert.pem)',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const { apiKey, useProxy, proxyUrl, proxyPort, proxyHost } = auth;
      
      // Validate API key
      if (!apiKey || typeof apiKey !== 'string') {
        return {
          valid: false,
          error: 'API key is required'
        };
      }

      if (apiKey.length < 10) {
        return {
          valid: false,
          error: 'API key appears to be too short. Please check your Pinecone API key.'
        };
      }

      // Validate proxy configuration if enabled
      if (useProxy) {
        if (!proxyUrl) {
          return {
            valid: false,
            error: 'Proxy URL is required when proxy is enabled'
          };
        }
        
        if (!proxyPort) {
          return {
            valid: false,
            error: 'Proxy port is required when proxy is enabled'
          };
        }
        
        if (!proxyHost) {
          return {
            valid: false,
            error: 'Proxy host is required when proxy is enabled'
          };
        }
      }

      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid authentication configuration'
      };
    }
  }
});

export const pineconeApi = createPiece({
  displayName: 'Pinecone API',
  auth: pineconeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pinecone-api.png',
  authors: ['Pinecone Team'],
  actions: [createIndex, upsertVector, updateVector, getVector, deleteVector, searchVector, searchText],
  triggers: []
});
