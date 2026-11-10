import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

export const getJourney = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_journey',
  classification: 'SEARCH',
  displayName: 'Find Journey',
  description: 'Finds journeys by name, status or tags.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Tarvent automation journeys whose name contains the given text, that have any of the given comma-separated tags, and/or with run status RUNNING or NOT_RUNNING; empty filters return all journeys. Returns up to 50 per call with hasMore and nextCursor (pass it back as Cursor for more). Use to get a journey ID. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.journeyPage,
  props: {
    name: Property.ShortText({ displayName: 'Journey name', description: 'Find journeys whose name contains this text.', required: false }),
    tags: Property.LongText({ displayName: 'Journey tags', description: 'Find journeys with any of these tags. Separate multiple tags with a comma.', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Journey status',
      required: false,
      options: {
        options: [
          { label: 'Running', value: 'RUNNING' },
          { label: 'Not running', value: 'NOT_RUNNING' },
        ],
      },
    }),
    limit: tarventCommon.limit,
    cursor: tarventCommon.cursor,
  },
  async run(context) {
    const { name, tags, status } = context.propsValue;
    return tarventClient.listPage({
      auth: context.auth.props,
      operation: 'FindJourneys',
      field: 'journeys',
      selection: tarventClient.fields.journey,
      argDefs: ', $where: JourneyInfoFilterInput',
      args: ', where: $where',
      variables: { where: tarventClient.journeyWhere({ name, tags, status }) },
      first: tarventCommon.pageLimit(context.propsValue.limit),
      after: tarventCommon.trimmed(context.propsValue.cursor),
    });
  },
});
