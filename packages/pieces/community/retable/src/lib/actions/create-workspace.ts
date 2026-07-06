import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableCreateWorkspaceAction = createAction({
  auth: retableAuth,
  name: 'retable_create_workspace',
  displayName: 'Create a Workspace',
  description: 'Creates a workspace',
  audience: 'both',
  aiMetadata: { description: 'Creates a new top-level Retable workspace with the given name and optional description. Use when an agent needs a fresh workspace to organize projects under. Not idempotent — each call creates another workspace, even with the same name.', idempotent: false },
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
          ApiKey: context.auth.secret_text,
        },
        body: {
          name: name,
          description: desc,
        },
      })
    ).body;
  },
});
