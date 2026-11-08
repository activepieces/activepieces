import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { twitchCommon } from '../common';

export const getPredictions = createAction({
  auth: twitchAuth,
  name: 'get_predictions',
  displayName: 'Get Predictions',
  description: 'List Channel Points predictions of your channel, or get them by ID.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'List Channel Points predictions of the connected account\'s own Twitch channel (most recent first) or get up to 25 by ID. Requires channel:read:predictions. Works on any channel; channels without Channel Points simply have no predictions. Returns predictions[] (id, title, outcomes[] with id/title/users/channel_points/color/top_predictors, winning_outcome_id, prediction_window, status ACTIVE/LOCKED/RESOLVED/CANCELED, created_at, locked_at, ended_at), count and next_cursor.',
    idempotent: true,
  },
  props: {
    prediction_ids: Property.Array({
      displayName: 'Prediction IDs',
      description: 'Up to 25 prediction IDs.',
      required: false,
    }),
    limit: twitchCommon.props.limit({ max: 100 }),
  },
  outputSchema: {
    fields: [
      {
        key: 'predictions',
        label: 'Predictions', labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Prediction ID' },
          { key: 'broadcaster_id', label: 'Broadcaster ID' },
          { key: 'broadcaster_login', label: 'Broadcaster Login' },
          { key: 'broadcaster_name', label: 'Broadcaster Name' },
          { key: 'title', label: 'Title' },
          { key: 'winning_outcome_id', label: 'Winning Outcome ID' },
          {
        key: 'outcomes',
        label: 'Outcomes', labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Outcome ID' },
          { key: 'title', label: 'Title' },
          { key: 'users', label: 'Users', format: 'number' },
          { key: 'channel_points', label: 'Channel Points', format: 'number' },
          { key: 'color', label: 'Color' },
          {
        key: 'top_predictors',
        label: 'Top Predictors', labelKey: 'user_name',
        listItems: [
          ...twitchCommon.userFields,
          { key: 'channel_points_used', label: 'Points Used', format: 'number' },
          { key: 'channel_points_won', label: 'Points Won', format: 'number' },
        ],
      },
        ],
      },
          { key: 'prediction_window', label: 'Prediction Window (seconds)', format: 'number' },
          { key: 'status', label: 'Status' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
          { key: 'ended_at', label: 'Ended At', format: 'datetime' },
          { key: 'locked_at', label: 'Locked At', format: 'datetime' },
        ],
      },
      ...twitchCommon.listMetaFields,
    ],
  },
  async run({ auth, propsValue }) {
    const predictionIds = twitchCommon.idList({ values: propsValue.prediction_ids, max: 25, label: 'Prediction IDs' });
    const limit = twitchCommon.validateLimitMax({ limit: propsValue.limit, max: 100 });
    const user = await twitchCommon.getTokenUser({ auth });
    const { items, nextCursor } = await twitchCommon.paginate<Record<string, unknown>>({
      auth,
      path: '/predictions',
      query: { broadcaster_id: user.id, id: predictionIds.length > 0 ? predictionIds : undefined },
      limit,
      pageSize: 25,
    });
    return { predictions: items, count: items.length, next_cursor: nextCursor };
  },
});
