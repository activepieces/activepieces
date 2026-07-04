import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { endpoint, kizeoFormsCommon } from '../common';
import { kizeoFormsAuth } from '../..';

export const getDataDefinition = createAction({
  auth: kizeoFormsAuth,

  name: 'get_data_definition', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Get Data Definition',
  description: 'Get the definition of a data',
  audience: 'both',
  aiMetadata: { description: 'Retrieve a single submitted data record (the answers) from a Kizeo Forms form by its form ID and data ID. Use to read back the contents of one specific submission. Read-only and idempotent.', idempotent: true },
  props: {
    formId: kizeoFormsCommon.formId,
    dataId: Property.Number({
      displayName: 'Data Id',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    const { formId, dataId } = context.propsValue;
    const response = await httpClient.sendRequest<{ data: unknown }>({
      method: HttpMethod.GET,
      url:
        endpoint +
        `v3/forms/${formId}/data/${dataId}?format=4&used-with-actives-pieces=`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: context.auth.secret_text,
      },
    });
    if (response.status === 200) {
      return response.body.data;
    }

    return [];
  },
});
