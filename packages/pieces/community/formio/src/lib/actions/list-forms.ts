import { createAction, Property } from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import { formioCommon } from '../common/client';

export const listForms = createAction({
  auth: formioAuth,
  name: 'list_forms',
  displayName: 'List Forms',
  description: 'List the forms in the Form.io project',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the forms in a Form.io project, each with its title, path and id. Use it to discover which forms exist, or to resolve a form title to the path the submission actions need. Set the type to resource to list resources instead of forms. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      defaultValue: 'form',
      options: {
        options: [
          { label: 'Forms', value: 'form' },
          { label: 'Resources', value: 'resource' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'How many to return. Defaults to 100.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const forms = await formioCommon.listForms({
      auth: auth.props,
      type: propsValue.type === 'resource' ? 'resource' : 'form',
      limit: propsValue.limit ?? 100,
    });
    return { forms, count: forms.length };
  },
});
