import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { GitlabApi } from './client';
import { gitlabAuth } from '../..';

export const gitlabCommon = {
  projectId: (required = true) =>
    Property.Dropdown({
      auth: gitlabAuth,
      displayName: 'Project',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Setup authentication first',
            options: [],
          };
        }
        const client = makeClient({
          auth: auth,
        });
        const res = await client.listProjects({
          simple: true,
          membership: true,
        });
        return {
          disabled: false,
          options: res.map((project) => {
            return {
              label: project.name,
              value: project.id,
            };
          }),
        };
      },
    }),
};

export function makeClient(propsValue: {
  auth: OAuth2PropertyValue;
}): GitlabApi {
  const token = getAccessTokenOrThrow(propsValue.auth);
  return new GitlabApi(token);
}
