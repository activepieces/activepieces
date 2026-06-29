import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeUpdateDispute = createAction({
  name: 'update_dispute',
  auth: stripeAuth,
  displayName: 'Update Dispute (Agent)',
  description: 'Submit or update evidence on a dispute.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Submits or updates evidence and metadata on a Stripe dispute (chargeback) to contest it. Set submit=true to finalize and submit the evidence to the bank — once submitted, evidence can no longer be changed. Prefer this (contest with evidence) over Close Dispute (which concedes). Idempotent for metadata/evidence edits; submitting is a one-way action.',
    idempotent: true,
  },
  props: {
    dispute_id: Property.ShortText({
      displayName: 'Dispute ID',
      description:
        'The dispute ID (e.g., dp_...). Obtain it from List Disputes.',
      required: true,
    }),
    evidence: Property.Json({
      displayName: 'Evidence',
      description:
        'A Stripe dispute evidence object (e.g., {"product_description":"...","customer_name":"..."}).',
      required: false,
    }),
    submit: Property.Checkbox({
      displayName: 'Submit',
      description:
        'If true, finalizes and submits the evidence to the bank. This cannot be undone.',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      required: false,
    }),
  },
  async run(context) {
    const { dispute_id, evidence, submit, metadata } = context.propsValue;

    const body: { [key: string]: unknown } = {};
    if (submit !== undefined) body.submit = submit;
    if (evidence && typeof evidence === 'object') {
      Object.keys(evidence).forEach((key) => {
        body[`evidence[${key}]`] = (evidence as Record<string, unknown>)[key];
      });
    }
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach((key) => {
        body[`metadata[${key}]`] = (metadata as Record<string, string>)[key];
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/disputes/${dispute_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});
