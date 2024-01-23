import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableCreateProjectAction = createAction({
  auth: retableAuth,
  name: 'retable_create_project',
  displayName: 'Create a Project',
  description: 'Creates a project in the given workspace',
  props: {
    workspace_id: retableCommon.workspace_id(),
    name: Property.ShortText({
      displayName: 'Project Name',
      required: true,
    }),
    desc: Property.LongText({
      displayName: 'Project Description',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Project Color',
      required: false,
    }),
  },
  async run(context) {
    const { workspace_id, name, desc, color } = context.propsValue;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${retableCommon.baseUrl}/workspace/${workspace_id}/project`,
        headers: {
          ApiKey: context.auth as string,
        },
        body: {
          name: name,
          description: desc,
          color: color,
        },
      })
    ).body;
  },
});
