import { Property, createAction } from '@activepieces/pieces-framework';
import { hesperanAuth } from '../auth';
import { hesperanApi } from '../common/client';
import { hesperanProps } from '../common/props';

export const decideWithProfile = createAction({
  auth: hesperanAuth,
  name: 'decide_with_profile',
  classification: 'WRITE',
  displayName: 'Decide with Profile',
  description:
    'Get a calibrated decision from one of your decision profiles, with the action "auto" (act on it) or "review" (hand it to a person).',
  audience: 'both',
  aiMetadata: {
    description:
      'Decide one case with a calibrated Hesperan decision profile and learn whether it is safe to automate (action "auto") or needs a person (action "review"). Use when a profile has been calibrated in the Hesperan console; for an ad-hoc question without a profile use "Ask a Question". Each call logs a new decision and is billed; set an Idempotency Key to make retries safe.',
    idempotent: false,
  },
  props: {
    profile: hesperanProps.profile({
      required: true,
      description:
        'A calibrated decision profile from your Hesperan account. Profiles are created and calibrated in the Hesperan console; one marked "not calibrated yet" cannot decide until its calibration succeeds.',
    }),
    state: hesperanProps.state(),
    send_as_json: hesperanProps.sendAsJson(),
    idempotency_key: Property.ShortText({
      displayName: 'Idempotency Key',
      description:
        'Optional. A stable ID of this case, for example the ticket ID (up to 255 visible ASCII characters, no spaces). If the same key arrives again within 24 hours with the same state, Hesperan returns the first decision and does not charge again.',
      required: false,
    }),
  },
  async run(context) {
    const { profile, state, send_as_json, idempotency_key } = context.propsValue;
    const slug = (profile ?? '').trim();
    if (!/^[a-z0-9-]{1,64}$/.test(slug)) {
      throw new Error('Profile must be the slug of a decision profile in lowercase letters, digits and hyphens, for example ticket-routing.');
    }
    const key = idempotency_key?.trim();
    if (key && !/^[\x21-\x7e]{1,255}$/.test(key)) {
      throw new Error('Idempotency Key must be 1 to 255 visible ASCII characters without spaces.');
    }
    const response = await hesperanApi.post<DecisionResponse>({
      apiKey: context.auth.secret_text,
      path: `/v1/decide/${encodeURIComponent(slug)}`,
      body: { state: hesperanProps.toState({ state, sendAsJson: send_as_json }) },
      headers: key ? { 'Idempotency-Key': key } : undefined,
    });
    const replayed = response.headers?.['idempotent-replayed'];
    return {
      ...response.body,
      automate: response.body.action === 'auto',
      replayed: replayed === 'true',
    };
  },
});

type DecisionResponse = {
  decision_id: string;
  profile: string;
  decision: string;
  confidence: number;
  action: 'auto' | 'review';
  threshold: number | null;
  target_precision: number;
  calibration_version: number;
  probabilities: Record<string, number>;
  raw_probabilities: Record<string, number>;
};
