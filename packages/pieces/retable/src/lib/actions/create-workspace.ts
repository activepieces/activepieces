import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableCreateWorkspaceAction = createAction({
  auth: retableAuth,
  name: 'retable_create_workspace',
  displayName: 'Create a Workspace',
  description: 'Creates a workspace',
  props: {
    name: Property.ShortText({
      displayName: 'Workspace Name',
      required: true,
    }),
    desc: Property.LongText({
      displayName: 'Workspace Description',
      required: false,
    }),
  },
  async run(context) {
    const { name, desc } = context.propsValue;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${retableCommon.baseUrl}/workspace`,
        headers: {
          ApiKey: context.auth as string,
        },
        body: {
          name: name,
          description: desc,
        },
      })
    ).body;
  },
});
