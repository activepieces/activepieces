import { createAction, Property } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifyOperations } from '../common/operations';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';

function clearCache() {
  return Property.Checkbox({
    displayName: 'Clear Build Cache',
    description: 'Clear the build cache before building.',
    required: false,
    defaultValue: false,
  });
}

export const startDeploy = createAction({
  auth: netlifyAuth,
  name: 'start_deploy',
  classification: 'WRITE',
  displayName: 'Start Deploy',
  description: 'Start a new build and deploy of a site from its Git repository.',
  audience: 'human',
  aiMetadata: {
    description:
      'Starts a new build of one Netlify site from its linked Git repository\'s production branch, optionally clearing the build cache first. Returns the build with its deploy_id; follow progress with Get Deploy. Each call queues another build, so do not retry blindly. The site must be linked to a repository.',
    idempotent: false,
  },
  outputSchema: netlifySchemas.build,
  props: {
    siteId: netlifyProps.siteDropdown({ description: 'The site to build and deploy.' }),
    clearCache: clearCache(),
  },
  async run({ auth, propsValue }) {
    return netlifyOperations.startBuild({ auth, siteId: propsValue.siteId, clearCache: propsValue.clearCache });
  },
});

export const startDeployById = createAction({
  auth: netlifyAuth,
  name: 'start_deploy_by_id',
  classification: 'WRITE',
  displayName: 'Start Deploy by Site ID',
  description: 'Start a new build and deploy of a site given its ID or domain.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts a new build of one Netlify site from its linked Git repository\'s production branch, optionally clearing the build cache first. Returns the build with its deploy_id; follow progress with Get Deploy. Each call queues another build, so do not retry blindly. The site must be linked to a repository. Get the site ID from List Sites.',
    idempotent: false,
  },
  outputSchema: netlifySchemas.build,
  props: {
    siteId: netlifyProps.siteId(),
    clearCache: clearCache(),
  },
  async run({ auth, propsValue }) {
    return netlifyOperations.startBuild({ auth, siteId: propsValue.siteId, clearCache: propsValue.clearCache });
  },
});
