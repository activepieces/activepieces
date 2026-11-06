import { createAction, OutputSchema, OutputSchemaField, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';

const { recordOf, str, num, arrayOf } = posthogClient;

function statusOf(r: Record<string, unknown>): string {
  if (r['archived'] === true) return 'archived';
  if (str(r['end_date'])) return 'complete';
  if (str(r['start_date'])) return 'running';
  return 'draft';
}

function question(raw: unknown) {
  const q = recordOf(raw);
  return {
    id: str(q['id']),
    type: str(q['type']),
    question: str(q['question']),
    choices: arrayOf(q['choices']).filter((c): c is string => typeof c === 'string'),
  };
}

const questionFields: OutputSchemaField[] = [
  { key: 'id', label: 'Question ID' },
  { key: 'type', label: 'Type', description: 'open, link, rating, single_choice or multiple_choice.' },
  { key: 'question', label: 'Question' },
  { key: 'choices', label: 'Choices' },
];

const surveySchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Survey ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status', description: 'draft, running, complete or archived.' },
    { key: 'questions', label: 'Questions', labelKey: 'question', listItems: questionFields },
    { key: 'linkedFlagKey', label: 'Linked Flag Key' },
    { key: 'startDate', label: 'Start Date', format: 'datetime' },
    { key: 'endDate', label: 'End Date', format: 'datetime' },
    { key: 'responsesLimit', label: 'Responses Limit', format: 'number' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'createdBy', label: 'Created By (email)', format: 'email' },
  ],
};

export const getSurvey = createAction({
  auth: posthogAuth,
  name: 'get_survey',
  classification: 'READ',
  displayName: 'Get Survey',
  description: 'Get one survey by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one PostHog survey by id (UUID from List Surveys): name, type, status (draft, running, complete, archived), questions (id, type, question text, choices), linked flag key, dates and responses limit. Use Get Survey Stats for response counts. Read-only.',
    idempotent: true,
  },
  outputSchema: surveySchema,
  props: {
    surveyId: Property.ShortText({ displayName: 'Survey ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const surveyId = posthogClient.uuid({ value: propsValue.surveyId, label: 'Survey ID' });
    if (surveyId === undefined) throw new Error('Survey ID is required.');
    const r = recordOf(
      await posthogClient.request({
        auth: auth.props,
        method: HttpMethod.GET,
        path: posthogClient.projectPath({ auth: auth.props, segments: ['surveys', surveyId] }),
      }),
    );
    return {
      id: str(r['id']),
      name: str(r['name']),
      description: str(r['description']),
      type: str(r['type']),
      status: statusOf(r),
      questions: arrayOf(r['questions']).map(question),
      linkedFlagKey: str(recordOf(r['linked_flag'])['key']),
      startDate: str(r['start_date']),
      endDate: str(r['end_date']),
      responsesLimit: num(r['responses_limit']),
      createdAt: str(r['created_at']),
      createdBy: str(recordOf(r['created_by'])['email']),
    };
  },
});
