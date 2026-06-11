import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const listJobInputs = createAction({
  auth: jungleGridAuth,
  name: 'list_job_inputs',
  displayName: 'List Job Inputs',
  description:
    'List uploaded Jungle Grid job inputs for the authenticated account, including input IDs and mount paths.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of uploaded inputs to return when supported by the API.',
      required: false,
      defaultValue: 20,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Optional cursor from a previous List Job Inputs response.',
      required: false,
    }),
    kind: Property.StaticDropdown({
      displayName: 'Kind',
      description: 'Optional input kind filter.',
      required: false,
      options: {
        options: [
          { label: 'Input', value: 'input' },
          { label: 'Script', value: 'script' },
        ],
      },
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Optional upload status filter when supported by Jungle Grid.',
      required: false,
    }),
  },
  async run(context) {
    return await jungleGridCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: jungleGridCommon.endpoints.jobInputs,
      queryParams: jungleGridCommon.buildListJobInputsQueryParams(context.propsValue),
    });
  },
});
