import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { endpoint, kizeoFormsCommon } from '../common';
import { kizeoFormsAuth } from '../..';

export const getDataDefinition = createAction({
  auth: kizeoFormsAuth,

  name: 'get_data_definition', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Get Data Definition',
  description: 'Get the definition of a data',
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
        Authorization: context.auth,
      },
    });
    if (response.status === 200) {
      return response.body.data;
    }

    return [];
  },
});
