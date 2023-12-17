import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableGetAllRetablesAction = createAction({
  auth: retableAuth,
  name: 'retable_get_retables',
  displayName: 'Get Retables',
  description: 'Gets all retables in given project',
  props: {
    workspace_id: retableCommon.workspace_id(),
    project_id: retableCommon.project_id(),
  },
  async run(context) {
    const { project_id } = context.propsValue;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${retableCommon.baseUrl}/project/${project_id}/retable`,
        headers: {
          ApiKey: context.auth as string,
        },
      })
    ).body;
  },
});
