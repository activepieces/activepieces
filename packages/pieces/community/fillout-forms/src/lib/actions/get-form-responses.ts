import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { formIdDropdown } from '../common/props';
import { filloutFormsAuth } from '../../index';

export const getFormResponses = createAction({
  auth: filloutFormsAuth,
  name: 'getFormResponses',
  displayName: 'Get Form Responses',
  description: 'Fetch all responses for a Fillout form, with optional filters.',
  props: {
    formId: formIdDropdown,
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      description: 'Max number of submissions to retrieve (1-150).'
    }),
    afterDate: Property.DateTime({
      displayName: 'After Date',
      required: false,
      description: 'Filter submissions after this date (YYYY-MM-DDTHH:mm:ss.sssZ).'
    }),
    beforeDate: Property.DateTime({
      displayName: 'Before Date',
      required: false,
      description: 'Filter submissions before this date (YYYY-MM-DDTHH:mm:ss.sssZ).'
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
      description: 'Starting position for fetching submissions.'
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'In Progress (unfinished)', value: 'in_progress' }
        ]
      },
      description: 'By default, only finished submissions are returned. Select "In Progress" to get unfinished submissions instead.'
    }),
    includeEditLink: Property.Checkbox({
      displayName: 'Include Edit Link',
      required: false,
      description: 'Include a link to edit the submission.'
    }),
    includePreview: Property.Checkbox({
      displayName: 'Include Preview',
      required: false,
      description: 'Include preview responses.'
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' }
        ]
      },
      description: 'Sort order.'
    }),
    search: Property.ShortText({
      displayName: 'Search',
      required: false,
      description: 'Filter for submissions containing this text.'
    })
  },
  async run(context) {
    const apiKey = context.auth as string;

    const formId = context.propsValue['formId'];
    const queryParams: Record<string, any> = {};
    if (context.propsValue['limit'] !== undefined)
      queryParams['limit'] = context.propsValue['limit'];
    if (context.propsValue['afterDate'] !== undefined)
      queryParams['afterDate'] = context.propsValue['afterDate'];
    if (context.propsValue['beforeDate'] !== undefined)
      queryParams['beforeDate'] = context.propsValue['beforeDate'];
    if (context.propsValue['offset'] !== undefined)
      queryParams['offset'] = context.propsValue['offset'];
    if (context.propsValue['status'] !== undefined)
      queryParams['status'] = context.propsValue['status'];
    if (context.propsValue['includeEditLink'] !== undefined)
      queryParams['includeEditLink'] = context.propsValue['includeEditLink'];
    if (context.propsValue['includePreview'] !== undefined)
      queryParams['includePreview'] = context.propsValue['includePreview'];
    if (context.propsValue['sort'] !== undefined)
      queryParams['sort'] = context.propsValue['sort'];
    if (context.propsValue['search'] !== undefined)
      queryParams['search'] = context.propsValue['search'];

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/forms/${formId}/submissions`,
      queryParams
    );

    return response;
  },
});
