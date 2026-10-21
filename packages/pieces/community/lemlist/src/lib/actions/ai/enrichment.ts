import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isRecord, lemlistApiCall, lemlistApiRequest } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { lemlistAuth } from '../../common/constants';
import { lemlistInput } from '../../common/input';
import { lemlistSchemas } from '../../common/schemas';

export const enrichLeadAction = createAction({
  auth: lemlistAuth,
  name: 'enrich_lead',
  classification: 'WRITE',
  displayName: 'Enrich Lead',
  description: 'Starts a credit-spending enrichment of a lead. Returns an enrichment ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts an enrichment of one existing lead (lea_...): find email, verify email, LinkedIn enrichment and/or find phone. Spends lemlist credits for each option chosen (check Get Team Credits first) and only runs when the user asked for it. At least one option is required. Returns an enrichment ID; poll Get Enrichment Result for the data. Not idempotent: each run can spend credits again.',
    idempotent: false,
  },
  props: {
    lead_id: aiProps.leadId(),
    find_email: Property.Checkbox({ displayName: 'Find Email', required: false }),
    verify_email: Property.Checkbox({ displayName: 'Verify Email', required: false }),
    linkedin_enrichment: Property.Checkbox({ displayName: 'LinkedIn Enrichment', required: false }),
    find_phone: Property.Checkbox({ displayName: 'Find Phone', required: false }),
  },
  outputSchema: lemlistSchemas.enrichment,
  async run({ auth, propsValue }) {
    const query = {
      findEmail: propsValue.find_email === true ? true : undefined,
      verifyEmail: propsValue.verify_email === true ? true : undefined,
      linkedinEnrichment: propsValue.linkedin_enrichment === true ? true : undefined,
      findPhone: propsValue.find_phone === true ? true : undefined,
    };
    if (Object.values(query).every((value) => value === undefined)) {
      throw new Error('Choose at least one enrichment option.');
    }
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `/leads/${lemlistInput.idSegment({ value: propsValue.lead_id, label: 'Lead ID', prefix: 'lea' })}/enrich`,
      query,
    });
  },
});

export const getEnrichmentResultAction = createAction({
  auth: lemlistAuth,
  name: 'get_enrichment_result',
  classification: 'READ',
  displayName: 'Get Enrichment Result',
  description: 'Returns the result of an enrichment request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the result of an enrichment started by Enrich Lead. done=false while lemlist is still working; try again later. When done, data holds the found email, phone or LinkedIn details. Read-only.',
    idempotent: true,
  },
  props: {
    enrichment_id: Property.ShortText({ displayName: 'Enrichment ID', required: true }),
  },
  outputSchema: lemlistSchemas.enrichmentResult,
  async run({ auth, propsValue }) {
    const enrichmentId = lemlistInput.requireText({ value: propsValue.enrichment_id, label: 'Enrichment ID' });
    const response = await lemlistApiRequest<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `/enrich/${lemlistInput.idSegment({ value: enrichmentId, label: 'Enrichment ID' })}`,
    });
    if (response.status === 202 || !isRecord(response.body)) {
      return { enrichmentId, done: false, enrichmentStatus: 'in_progress', input: null, data: null };
    }
    return { ...response.body, enrichmentId: response.body['enrichmentId'] ?? enrichmentId, done: true };
  },
});
