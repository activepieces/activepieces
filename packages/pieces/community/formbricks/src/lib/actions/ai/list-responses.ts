import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../../common/auth';
import { formbricksApi } from '../../common/api';
import { formbricksInputs } from '../../common/inputs';
import { formbricksSchemas } from '../../common/schemas';

export const listResponsesAiAction = createAction({
  auth: formBricksAuth,
  name: 'list_responses_ai',
  classification: 'SEARCH',
  displayName: 'List Responses (AI)',
  description: 'Lists Formbricks responses filtered by survey, contact and date.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List Formbricks survey responses (answers keyed by question ID, finished flag, contact, meta), filtered by surveyId, contactId and a date range on createdAt or updatedAt. Paged with limit (max 250) and skip; has_more tells you to fetch the next page. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    surveyId: Property.ShortText({ displayName: 'Survey ID', required: false }),
    contactId: Property.ShortText({ displayName: 'Contact ID', required: false }),
    startDate: Property.ShortText({ displayName: 'From (ISO date)', required: false }),
    endDate: Property.ShortText({ displayName: 'To (ISO date)', required: false }),
    dateField: Property.StaticDropdown({
      displayName: 'Date Field',
      description: 'Field the date range and sort order use. Default createdAt.',
      required: false,
      options: { options: [{ label: 'createdAt', value: 'createdAt' }, { label: 'updatedAt', value: 'updatedAt' }] },
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      required: false,
      options: { options: [{ label: 'Newest first', value: 'desc' }, { label: 'Oldest first', value: 'asc' }] },
    }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 250, default 50.', required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'Default 0.', required: false }),
  },
  outputSchema: formbricksSchemas.listResponses,
  async run({ auth, propsValue }) {
    return formbricksApi.listResponses({
      auth,
      surveyId: formbricksInputs.optionalString(propsValue.surveyId),
      contactId: formbricksInputs.optionalString(propsValue.contactId),
      startDate: formbricksInputs.optionalDate({ value: propsValue.startDate, label: 'From' }),
      endDate: formbricksInputs.optionalDate({ value: propsValue.endDate, label: 'To' }),
      dateField: formbricksInputs.optionalString(propsValue.dateField),
      order: formbricksInputs.optionalString(propsValue.order),
      limit: formbricksInputs.clampInt({ value: propsValue.limit, min: 1, max: 250, fallback: 50 }),
      skip: formbricksInputs.clampInt({ value: propsValue.skip, min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 }),
    });
  },
});
