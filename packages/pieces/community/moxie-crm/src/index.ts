import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { moxieCreateClientAction } from './lib/actions/create-client';
import { moxieCreateProjectAction } from './lib/actions/create-project';
import { moxieCreateTaskAction } from './lib/actions/create-task';
import { moxieCRMTriggers } from './lib/triggers';
export const moxieCRMAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
  To obtain your Moxie CRM token, follow these steps:

  1. Log in to your Moxie CRM account and click on **Workspace Settings** (Bottom left).
  2. Click on **Connected Apps** and navigate to **Integrations** tab.
  3. Now, under "Custom Integration", click on **Enable Custom Integration**.
  4. Copy **API Key** and **Base URL** and click on Save button.
  `,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'The API Key of the Moxie CRM account',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The Base URL of the Moxie CRM account',
      required: true,
    }),
  },
});

export const moxieCrm = createPiece({
  displayName: 'Moxie',
  description: 'CRM build for the freelancers.',

  auth: moxieCRMAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/moxie-crm.png',
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    moxieCreateClientAction,
    moxieCreateTaskAction,
    moxieCreateProjectAction,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { baseUrl: string }).baseUrl,
      auth: moxieCRMAuth,
      authMapping: async (auth) => ({
        'X-API-KEY': (auth as { apiKey: string }).apiKey,
      }),
    }),
  ],
  triggers: moxieCRMTriggers,
});
