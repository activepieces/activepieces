import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wufooApiCall } from '../common/client';
import { wufooAuth } from '../../index';
import { formIdentifier } from '../common/props';

export const createFormEntryAction = createAction({
  auth: wufooAuth,
  name: 'create-form-entry',
  displayName: 'Create Form Entry',
  description: 'Programmatically submit a response to a Wufoo form.',
  props: {
    formIdentifier: formIdentifier,
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'XML', value: 'xml' },
        ],
      },
    }),
    entryData: Property.Json({
      displayName: 'Entry Data',
      required: true,
      description:
        'Key-value pairs for field data to submit. Keys should be like "Field1", "Field105", etc.',
    }),
  },
  async run(context) {
    const { formIdentifier, format, entryData } = context.propsValue;

    const response = await wufooApiCall({
      method: HttpMethod.POST,
      auth: context.auth,
      resourceUri: `/forms/${formIdentifier}/entries.${format}`,
      body: new URLSearchParams(
        Object.fromEntries(
          Object.entries(entryData).map(([k, v]) => [k, v == null ? '' : String(v)])
        )
      ).toString(),
    });

    return response;
  },
});
