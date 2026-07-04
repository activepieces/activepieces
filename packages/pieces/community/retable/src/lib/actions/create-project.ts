import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableCreateProjectAction = createAction({
  auth: retableAuth,
  name: 'retable_create_project',
  displayName: 'Create a Project',
  description: 'Creates a project in the given workspace',
  audience: 'both',
  aiMetadata: { description: 'Creates a new project inside an existing Retable workspace, with a name and optional description and color. Use to set up a project container for retables; requires the target workspace ID. Not idempotent — each call creates another project.', idempotent: false },
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
          ApiKey: context.auth.secret_text,
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
