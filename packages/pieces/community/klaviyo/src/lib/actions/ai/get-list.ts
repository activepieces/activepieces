import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../common/auth';
import { klaviyoApi, pathFor, resourceOf } from '../../common/client';
import { klaviyoInputs } from '../../common/ai-props';
import { klaviyoOutputSchemas } from '../../common/output-schemas';

export const getListAi = createAction({
  auth: klaviyoAuth,
  name: 'get_list_ai',
  classification: 'READ',
  displayName: 'Get List',
  description: 'Get one Klaviyo list with its member count.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Klaviyo list by list ID with its name, opt-in process and profile_count (number of members). Find the ID with List Lists or Find List by Name; to read the members use List List Members. Klaviyo allows only about 1 call per second here. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.aiList,
  props: {
    list_id: klaviyoInputs.idProp({
      displayName: 'List ID',
      description: 'The list ID. Get it from List Lists or Find List by Name.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const listId = klaviyoInputs.requireText({ value: propsValue.list_id, label: 'List ID' });
    const response = await klaviyoApi.send({
      auth,
      method: HttpMethod.GET,
      path: pathFor(['lists', listId]),
      query: { 'additional-fields[list]': 'profile_count' },
    });
    const list = resourceOf(response.body);
    if (list === undefined) {
      throw new Error(`Klaviyo returned no list for ID ${listId}.`);
    }
    return klaviyoInputs.flatGroup(list);
  },
});
