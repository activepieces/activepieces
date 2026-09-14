import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

function buildValueBody(
  fieldType: string,
  value: string
): Record<string, unknown> {
  switch (fieldType) {
    case 'text':
      return { value: { text: value } };
    case 'number':
      return { value: { number: value } };
    case 'date':
      return { value: { date: value } };
    case 'checkbox':
      return { value: { checked: value === 'true' } };
    case 'list':
      return { idValue: value };
    default:
      throw new Error(
        `Unsupported field type "${fieldType}". Use text, number, date, checkbox or list.`
      );
  }
}

export const setCardCustomFieldValue = createAction({
  auth: trelloAuth,
  name: 'set_card_custom_field_value',
  classification: 'WRITE',
  displayName: 'Set Card Custom Field Value (Agent)',
  description: "Set a custom field's value on a card.",
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets one custom field value on one card. The Field Type must match the field definition from List Board Custom Fields, because Trello rejects a value written in the wrong shape: text, number and date take the value directly, checkbox takes true or false, and a dropdown takes an option id from List Custom Field Options rather than the option text. Writing the same value again produces the same state, so it is idempotent.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
    custom_field_id: Property.ShortText({
      displayName: 'Custom Field ID',
      description:
        'The ID of the custom field. Obtain it from List Board Custom Fields.',
      required: true,
    }),
    field_type: Property.StaticDropdown({
      displayName: 'Field Type',
      description:
        'Must match the type of the custom field being written, as reported by List Board Custom Fields.',
      required: true,
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Number', value: 'number' },
          { label: 'Date', value: 'date' },
          { label: 'Checkbox', value: 'checkbox' },
          { label: 'Dropdown (list)', value: 'list' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description:
        'Text for a text field, digits for a number, an ISO 8601 timestamp such as 2026-03-13T16:00:00.000Z for a date, true or false for a checkbox, or an option id from List Custom Field Options for a dropdown.',
      required: true,
    }),
  },

  async run(context) {
    const fieldType = context.propsValue['field_type'];
    const body = buildValueBody(fieldType, context.propsValue['value']);

    try {
      const request: HttpRequest = {
        method: HttpMethod.PUT,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/customField/${context.propsValue['custom_field_id']}/item`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
        body,
      };
      const response = await httpClient.sendRequest<Record<string, unknown>>(
        request
      );
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card or custom field not found. Verify the card_id and custom_field_id, and that the Custom Fields Power-Up is enabled on the board.'
      );
    }
  },
});
