import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wufooApiCall } from '../common/client';
import { wufooAuth } from '../../index';
import { formIdentifier } from '../common/props';

export const findSubmissionByFieldAction = createAction({
  auth: wufooAuth,
  name: 'find-submission-by-field',
  displayName: 'Find Submission by Field Value',
  description:
    'Search submissions by matching a specific field value (e.g. email, name) in a form.',
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
    fieldId: Property.ShortText({
      displayName: 'Field ID',
      description:
        'The API Field ID to search by (e.g. Field1 for name, Field218 for email). You can find these via the Form Fields API or API Info page.',
      required: true,
    }),
    matchValue: Property.ShortText({
      displayName: 'Match Value',
      description: 'The exact value to search for in the field.',
      required: true,
    }),
    operator: Property.StaticDropdown({
      displayName: 'Match Operator',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Is Equal To', value: 'Is_equal_to' },
          { label: 'Is Not Equal To', value: 'Is_not_equal_to' },
          { label: 'Contains', value: 'Contains' },
          { label: 'Does Not Contain', value: 'Does_not_contain' },
          { label: 'Begins With', value: 'Begins_with' },
          { label: 'Ends With', value: 'Ends_with' },
        ],
      },
      defaultValue: 'Is_equal_to',
    }),
    matchMode: Property.StaticDropdown({
      displayName: 'Match Mode',
      description: 'Use AND or OR if combining with more filters (optional)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'AND', value: 'AND' },
          { label: 'OR', value: 'OR' },
        ],
      },
    }),
    pageStart: Property.Number({
      displayName: 'Page Start',
      required: false,
      defaultValue: 0,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of results to return (max 100).',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const {
      formIdentifier,
      format,
      fieldId,
      matchValue,
      operator,
      matchMode,
      pageStart,
      pageSize,
    } = context.propsValue;

    const query: Record<string, string> = {
      [`Filter1`]: `${fieldId}+${operator}+${encodeURIComponent(matchValue)}`,
      pageStart: String(pageStart ?? 0),
      pageSize: String(pageSize ?? 25),
    };

    if (matchMode) {
      query['match'] = matchMode;
    }

    const response = await wufooApiCall({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: `/forms/${formIdentifier}/entries.${format}`,
      query,
    });

    return response;
  },
});
