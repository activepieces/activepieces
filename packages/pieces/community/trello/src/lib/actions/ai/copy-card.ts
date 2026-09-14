import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { copyCardActionOutputSchema } from '../../output-schemas';

export const copyCard = createAction({
  auth: trelloAuth,
  name: 'copy_card',
  classification: 'WRITE',
  displayName: 'Copy Card (Agent)',
  description: 'Copy an existing card into a list.',
  audience: 'ai',
  outputSchema: copyCardActionOutputSchema,
  aiMetadata: {
    description:
      'Copies an existing card into a list, optionally carrying over parts of the original such as its checklists, attachments, comments, labels, members or due date. Use it to instantiate a template card; use Create Card when there is nothing to copy from. Both the source card id and the destination list id are required, and each call produces another copy, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    source_card_id: Property.ShortText({
      displayName: 'Source Card ID',
      description: 'The ID of the card to copy. Obtain it from Search Cards.',
      required: true,
    }),
    list_id: Property.ShortText({
      displayName: 'Destination List ID',
      description:
        'The ID of the list the copy is created in. Obtain it from List Lists.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name for the copy. Defaults to the source card name.',
      required: false,
    }),
    keep_from_source: Property.StaticMultiSelectDropdown({
      displayName: 'Keep From Source',
      description:
        'Which parts of the original to carry over. Leave empty to copy the card without them.',
      required: false,
      options: {
        options: [
          { label: 'Attachments', value: 'attachments' },
          { label: 'Checklists', value: 'checklists' },
          { label: 'Comments', value: 'comments' },
          { label: 'Due Date', value: 'due' },
          { label: 'Labels', value: 'labels' },
          { label: 'Members', value: 'members' },
          { label: 'Stickers', value: 'stickers' },
        ],
      },
    }),
    position: Property.StaticDropdown({
      displayName: 'Position',
      description: 'Where the copy lands in the destination list.',
      required: false,
      options: {
        options: [
          { label: 'Top', value: 'top' },
          { label: 'Bottom', value: 'bottom' },
        ],
      },
    }),
  },

  async run(context) {
    const keepFromSource = context.propsValue['keep_from_source'];
    const params: QueryParams = {
      idCardSource: context.propsValue['source_card_id'],
      idList: context.propsValue['list_id'],
    };
    if (context.propsValue['name']) {
      params['name'] = context.propsValue['name'];
    }
    if (context.propsValue['position']) {
      params['pos'] = context.propsValue['position'];
    }
    if (keepFromSource !== undefined && keepFromSource.length > 0) {
      params['keepFromSource'] = keepFromSource.join(',');
    }

    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}cards`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest<Record<string, unknown>>(
        request
      );
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Source card or destination list not found. Verify the source_card_id and list_id.'
      );
    }
  },
});
