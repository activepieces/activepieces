import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { moxieCRMTriggers } from './lib/triggers';
import { moxieCreateProjectAction } from './lib/actions/create-project';
import { moxieCreateClientAction } from './lib/actions/create-client';
import { moxieCreateTaskAction } from './lib/actions/create-task';
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
  auth: moxieCRMAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/moxie-crm.png',
  authors: ['kishanprmr'],
  actions: [
    moxieCreateClientAction,
    moxieCreateTaskAction,
    moxieCreateProjectAction,
  ],
  triggers: moxieCRMTriggers,
});
