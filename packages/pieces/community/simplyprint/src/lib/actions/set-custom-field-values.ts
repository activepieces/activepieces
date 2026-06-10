import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { simplyprintCustomFields } from '../common/custom-fields';

export const setCustomFieldValuesAction = createAction({
  auth: simplyprintAuth,
  name: 'set_custom_field_values',
  displayName: 'Set Custom Field Values',
  description:
    'Set custom field values on one or more entities (queue items, files, printers, etc.).',
  props: {
    category: Property.StaticDropdown({
      displayName: 'Category',
      description: 'Entity category the fields belong to.',
      required: true,
      options: {
        options: [
          { label: 'Print (queue items / jobs / files)', value: 'print' },
          { label: 'Printer', value: 'printer' },
          { label: 'Filament', value: 'filament' },
          { label: 'User file', value: 'user_file' },
          { label: 'User', value: 'user' },
        ],
      },
    }),
    subCategory: Property.StaticDropdown({
      displayName: 'Sub-category',
      description:
        'Only applicable for the "print" category. Pick the specific entity type the fields belong to.',
      required: false,
      options: {
        options: [
          { label: 'Print queue item', value: 'print_queue' },
          { label: 'Print job', value: 'print_job' },
          { label: 'User file', value: 'user_file' },
        ],
      },
    }),
    entityIds: Property.Array({
      displayName: 'Entity IDs',
      description: 'Numeric IDs of the target entities.',
      required: true,
    }),
    values: Property.Object({
      displayName: 'Values',
      description:
        'Object keyed by custom-field UUID (fieldId) → value. Converted to the backend submission array automatically.',
      required: true,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      category: context.propsValue.category,
      entityIds: (context.propsValue.entityIds ?? []).map(Number),
      values: simplyprintCustomFields.toSubmissionArray(context.propsValue.values ?? {}),
    };
    if (context.propsValue.subCategory) {
      body['subCategory'] = context.propsValue.subCategory;
    }
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'custom_fields/SubmitValues',
      body,
    });
  },
});
