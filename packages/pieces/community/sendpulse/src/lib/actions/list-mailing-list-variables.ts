import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema } from '@activepieces/pieces-framework';
import { isRecord, parseMailingListId, sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';
import { mailingListDropdown } from '../common/props';

const outputSchema: OutputSchema = {
  fields: [
    { key: 'mailingListId', label: 'Mailing List ID' },
    {
      key: 'variables',
      label: 'Variables',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listMailingListVariablesAction = createAction({
  auth: sendpulseAuth,
  name: 'list_mailing_list_variables',
  classification: 'SEARCH',
  displayName: 'List Mailing List Variables',
  description: 'List the variables (custom fields) defined on a SendPulse mailing list.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the variables (custom fields: name and type such as string, number, date) defined on one SendPulse mailing list, identified by its numeric ID. Use before Update Subscriber to learn valid variable names and value types. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    mailingListId: mailingListDropdown,
  },
  outputSchema,
  async run(context) {
    const listId = parseMailingListId(context.propsValue.mailingListId);
    const response = await sendpulseApiCall<unknown>({
      method: HttpMethod.GET,
      auth: context.auth.props,
      resourceUri: `/addressbooks/${listId}/variables`,
      operation: 'list mailing list variables',
    });
    const variables = (Array.isArray(response) ? response.filter(isRecord) : []).map((item) => ({
      name: item['name'] ?? null,
      type: item['type'] ?? null,
    }));
    return { mailingListId: listId, variables, count: variables.length };
  },
});
