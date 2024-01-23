import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableGetAllProjectsAction = createAction({
  auth: retableAuth,
  name: 'retable_get_projects',
  displayName: 'Get Projects',
  description: 'Gets all projects in given workspace',
  props: {
    workspace_id: retableCommon.workspace_id(),
  },
  async run(context) {
    const { workspace_id } = context.propsValue;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${retableCommon.baseUrl}/workspace/${workspace_id}/project`,
        headers: {
          ApiKey: context.auth as string,
        },
      })
    ).body;
  },
});
