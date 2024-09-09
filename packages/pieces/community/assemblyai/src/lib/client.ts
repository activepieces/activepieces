import {
  ActionContext,
  SecretTextProperty,
} from '@activepieces/pieces-framework';
import { AssemblyAI } from 'assemblyai';

export const getAssemblyAIClient = (
  context: ActionContext<SecretTextProperty<true>>
): AssemblyAI => {
  return new AssemblyAI({
    apiKey: context.auth,
  });
};
