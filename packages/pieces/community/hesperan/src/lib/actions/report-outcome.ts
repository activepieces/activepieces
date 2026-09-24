import { Property, createAction } from '@activepieces/pieces-framework';
import { hesperanAuth } from '../auth';
import { hesperanApi } from '../common/client';
import { hesperanProps } from '../common/props';

export const reportOutcome = createAction({
  auth: hesperanAuth,
  name: 'report_outcome',
  classification: 'WRITE',
  displayName: 'Report Outcome',
  description:
    'Tell Hesperan the correct answer for an earlier decision, so the console can show the live precision of automated decisions. Free of charge.',
  audience: 'both',
  aiMetadata: {
    description:
      'Record the correct answer for a decision made earlier with "Decide with Profile", identified by its decision_id. Use once the real outcome is known, for auto and review decisions alike. Each decision takes one outcome: repeating the same answer is accepted, a different answer is refused.',
    idempotent: true,
  },
  props: {
    decision_id: Property.ShortText({
      displayName: 'Decision ID',
      description: 'The decision_id returned by "Decide with Profile", for example 0f6c2a4e-5b1d-4c1e-9a7f-2d3b8e6f1a90.',
      required: true,
    }),
    profile: hesperanProps.profile({
      required: false,
      description:
        'The profile that made the decision. Only used to list its answers below; the decision ID alone identifies the decision.',
    }),
    actual: hesperanProps.answer(),
  },
  async run(context) {
    const decisionId = context.propsValue.decision_id.trim();
    const actual = String(context.propsValue.actual ?? '').trim();
    if (!decisionId || !actual) {
      throw new Error('Decision ID and Correct Answer are required.');
    }
    const response = await hesperanApi.post<{ ok: boolean; duplicate?: boolean }>({
      apiKey: context.auth.secret_text,
      path: '/v1/outcomes',
      body: { decision_id: decisionId, actual },
    });
    return {
      ok: response.body.ok,
      duplicate: response.body.duplicate === true,
      decision_id: decisionId,
      actual,
    };
  },
});
