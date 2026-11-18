import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

export const getCustomEvent = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_custom_event',
  classification: 'SEARCH',
  displayName: 'Find Custom Event',
  description: 'Finds custom events by name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches the custom event definitions in a Tarvent account whose name contains the given text; an empty name returns all. Returns up to 50 per call with hasMore and nextCursor. The key field is what Generate A Custom Event needs. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.customEventPage,
  props: {
    name: Property.ShortText({ displayName: 'Custom event name', description: 'Find custom events whose name contains this text.', required: false }),
    limit: tarventCommon.limit,
    cursor: tarventCommon.cursor,
  },
  async run(context) {
    const name = tarventCommon.trimmed(context.propsValue.name);
    return tarventClient.listPage({
      auth: context.auth.props,
      operation: 'FindCustomEvents',
      field: 'customApiEvents',
      selection: 'id key name description createdUtc modifiedUtc',
      argDefs: ', $where: CustomApiEventFilterInput',
      args: ', where: $where',
      variables: { where: name ? { name: { contains: name } } : null },
      first: tarventCommon.pageLimit(context.propsValue.limit),
      after: tarventCommon.trimmed(context.propsValue.cursor),
    });
  },
});
