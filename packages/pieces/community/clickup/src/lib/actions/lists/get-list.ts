import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';
import { listOutputSchema } from '../../output-schemas';

export const getClickupList = createAction({
  auth: clickupAuth,

  name: 'get_list',
  classification: 'READ',
  description: 'Get one ClickUp list by its ID.',
  audience: 'human',
  aiMetadata: { description: 'Read-only: fetch the details of a single ClickUp list by its list ID. Use when you already know the list ID; does not modify anything and is safe to call repeatedly.', idempotent: true },
  displayName: 'Get List',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: "The number at the end of the list's URL in ClickUp.",
      placeholder: 'e.g. 901204567890',
      required: true,
    }),
  },
  outputSchema: listOutputSchema,
  async run(configValue) {
    const { list_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.GET,
      `list/${list_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );

    return response.body;
  },
});
