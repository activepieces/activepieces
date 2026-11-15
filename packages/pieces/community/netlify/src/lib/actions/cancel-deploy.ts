import { createAction } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifyOperations } from '../common/operations';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';

export const cancelDeploy = createAction({
  auth: netlifyAuth,
  name: 'cancel_deploy',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Deploy',
  description: 'Stop a deploy that is still queued or building.',
  audience: 'both',
  aiMetadata: {
    description:
      'Cancels one Netlify deploy that is still enqueued or building; the build stops and cannot be resumed (start a new one with Start Deploy). Fails if the deploy has already finished. Returns the cancelled deploy.',
    idempotent: false,
  },
  outputSchema: netlifySchemas.deploy,
  props: { deployId: netlifyProps.deployId({ description: 'The ID of the queued or building deploy to cancel.' }) },
  async run({ auth, propsValue }) {
    return netlifyOperations.cancelDeploy({ auth, deployId: propsValue.deployId });
  },
});
