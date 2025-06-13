import { attioAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { attioApiService } from '../common/request';

export const findRecord = createAction({
  auth: attioAuth,
  name: 'findRecord',
  displayName: 'Find Record',
  description: 'Retrieves a record in Attio by unique attributes',
  props: {
    object: Property.ShortText({
      displayName: 'Object',
      description: 'The object to find records for (e.g. people, companies).',
      required: true,
    }),
    filter: Property.Object({
      displayName: 'Filter',
      description:
        'Filter criteria to apply. For example: {"name": "John Doe"}',
      required: false,
    }),
    sorts: Property.Array({
      displayName: 'Sort',
      description: 'Sort order for results',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return (default: 500)',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of records to skip (default: 0)',
      required: false,
    }),
  },
  async run(context) {
    const { object, filter, sorts, limit, offset } = context.propsValue;

    return await attioApiService.findRecord({
      auth: context.auth,
      object,
      payload: {
        filter,
        sorts,
        limit,
        offset
      }
    })
  },
});
