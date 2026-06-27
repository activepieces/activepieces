import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistLabelsClient } from '../common/client/labels-client';
import { todoistAuth } from '../..';

export const todoistListSharedLabelsAction = createAction({
  auth: todoistAuth,
  name: 'todoist_list_shared_labels',
  displayName: 'List Shared Labels',
  description: 'Lists shared (workspace) label names in Todoist.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the names of shared (workspace) labels — labels applied to tasks but not saved in the personal label list. Use this to resolve the exact name before renaming or removing a shared label; for the user\'s own saved labels use List Labels instead. Shared labels are identified by name, not ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    omit_personal: Property.Checkbox({
      displayName: 'Omit Personal',
      description:
        'When true, names that also exist as personal labels are excluded, returning only purely shared labels.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth.access_token;
    const { omit_personal } = propsValue;

    assertNotNullOrUndefined(token, 'token');
    const sharedLabels = await todoistLabelsClient.listShared({ token, omit_personal });
    return { shared_labels: sharedLabels, count: sharedLabels.length };
  },
});
