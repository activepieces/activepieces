import { createAction } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifyOperations } from '../common/operations';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';

export const getDeploy = createAction({
  auth: netlifyAuth,
  name: 'get_deploy',
  classification: 'READ',
  displayName: 'Get Deploy',
  description: 'Get a deploy by its ID, including its state, branch, commit and URLs.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets one Netlify deploy by deploy ID with its state (enqueued, building, ready, error, cancelled…), error message, branch, commit, context and preview URL. Use it to check whether a build started by Start Deploy has finished. Read-only.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.deploy,
  props: { deployId: netlifyProps.deployId() },
  async run({ auth, propsValue }) {
    return netlifyOperations.getDeploy({ auth, deployId: propsValue.deployId });
  },
});
