import { createAction, OutputSchema, OutputSchemaField, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';

const { recordOf, str, num } = posthogClient;

function eventStats(raw: unknown) {
  const s = recordOf(raw);
  return {
    total: num(s['total_count']) ?? 0,
    uniquePersons: num(s['unique_persons']) ?? 0,
    firstSeen: str(s['first_seen']),
    lastSeen: str(s['last_seen']),
  };
}

function statsFields(prefix: string): OutputSchemaField[] {
  return [
    { key: 'total', label: `${prefix} (total)`, format: 'number' },
    { key: 'uniquePersons', label: `${prefix} (unique persons)`, format: 'number' },
    { key: 'firstSeen', label: `${prefix} first`, format: 'datetime' },
    { key: 'lastSeen', label: `${prefix} last`, format: 'datetime' },
  ];
}

const statsSchema: OutputSchema = {
  fields: [
    { key: 'surveyId', label: 'Survey ID' },
    { key: 'shown', label: 'Shown', children: statsFields('Shown') },
    { key: 'sent', label: 'Responses', children: statsFields('Responses') },
    { key: 'dismissed', label: 'Dismissed', children: statsFields('Dismissed') },
    { key: 'responseRate', label: 'Response Rate %', format: 'number' },
    { key: 'dismissalRate', label: 'Dismissal Rate %', format: 'number' },
    { key: 'uniqueUsersResponseRate', label: 'Unique Users Response Rate %', format: 'number' },
    { key: 'uniqueUsersDismissalRate', label: 'Unique Users Dismissal Rate %', format: 'number' },
    { key: 'dateFrom', label: 'From', format: 'datetime' },
    { key: 'dateTo', label: 'To', format: 'datetime' },
  ],
};

export const getSurveyStats = createAction({
  auth: posthogAuth,
  name: 'get_survey_stats',
  classification: 'READ',
  displayName: 'Get Survey Stats',
  description: 'Get shown, response and dismissal counts and rates for one survey.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns response statistics for one PostHog survey (UUID from List Surveys): counts and unique persons for survey shown, sent (responses) and dismissed events, first/last seen, and response/dismissal rates in percent. Optional dateFrom/dateTo (ISO 8601) narrow the window; default is the whole survey lifetime. Does not return individual answers; use Run HogQL Query on "survey sent" events for those. Read-only.',
    idempotent: true,
  },
  outputSchema: statsSchema,
  props: {
    surveyId: Property.ShortText({ displayName: 'Survey ID', required: true }),
    dateFrom: Property.ShortText({ displayName: 'From', description: 'ISO 8601 date-time', required: false }),
    dateTo: Property.ShortText({ displayName: 'To', description: 'ISO 8601 date-time', required: false }),
  },
  async run({ auth, propsValue }) {
    const surveyId = posthogClient.uuid({ value: propsValue.surveyId, label: 'Survey ID' });
    if (surveyId === undefined) throw new Error('Survey ID is required.');
    const dateFrom = posthogClient.isoTimestamp({ value: propsValue.dateFrom, label: 'From' });
    const dateTo = posthogClient.isoTimestamp({ value: propsValue.dateTo, label: 'To' });
    const body = recordOf(
      await posthogClient.request({
        auth: auth.props,
        method: HttpMethod.GET,
        path: posthogClient.projectPath({ auth: auth.props, segments: ['surveys', surveyId, 'stats'] }),
        query: { date_from: dateFrom, date_to: dateTo },
      }),
    );
    const stats = recordOf(body['stats']);
    const rates = recordOf(body['rates']);
    return {
      surveyId: str(body['survey_id']) ?? surveyId,
      shown: eventStats(stats['survey shown']),
      sent: eventStats(stats['survey sent']),
      dismissed: eventStats(stats['survey dismissed']),
      responseRate: num(rates['response_rate']),
      dismissalRate: num(rates['dismissal_rate']),
      uniqueUsersResponseRate: num(rates['unique_users_response_rate']),
      uniqueUsersDismissalRate: num(rates['unique_users_dismissal_rate']),
      dateFrom: str(body['start_date']) ?? dateFrom ?? null,
      dateTo: str(body['end_date']) ?? dateTo ?? null,
    };
  },
});
