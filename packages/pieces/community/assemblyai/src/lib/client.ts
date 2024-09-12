import {
  ActionContext,
  SecretTextProperty,
} from '@activepieces/pieces-framework';
import { AssemblyAI } from 'assemblyai';
import packageJson from '../../package.json';

export const baseUrl = 'https://api.assemblyai.com';
// Proxyman proxy
// export const baseUrl = 'http://localhost:10000';

export const getAssemblyAIClient = (
  context: ActionContext<SecretTextProperty<true>>
): AssemblyAI => {
  if (!context.auth) throw new Error('The AssemblyAI API key is required.');
  return new AssemblyAI({
    apiKey: context.auth,
    userAgent: {
      integration: {
        name: 'Activepieces',
        version: packageJson.version,
      },
    },
    baseUrl,
  });
};
