import { createAction, Property } from '@activepieces/pieces-framework';
import { omniAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { documentIdDropdown } from '../common/props';

export const moveDocument = createAction({
  auth: omniAuth,
  name: 'moveDocument',
  displayName: 'Move document',
  description: 'Moves a document to a new folder or to the root level',
  props: {
    identifier: documentIdDropdown,
    folderPath: Property.ShortText({
      displayName: 'Folder Path',
      description:
        'The path of the destination folder. Use null to move the document to the root level (no folder)',
      required: true,
    }),
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      description:
        'Optional sharing scope for the document. If not provided, the scope will be computed',
      options: {
        disabled: false,
        options: [
          { label: 'Organization', value: 'organization' },
          { label: 'Restricted', value: 'restricted' },
        ],
      },
      required: false,
    }),
  },
  async run(context) {
    const { identifier, folderPath, scope } = context.propsValue;

    const body: Record<string, unknown> = {
      folderPath: folderPath === 'null' ? null : folderPath,
    };

    if (scope) {
      body['scope'] = scope;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.PUT,
      `/documents/${identifier}/move`,
      body
    );

    return response;
  },
});
