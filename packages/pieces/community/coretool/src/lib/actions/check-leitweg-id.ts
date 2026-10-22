import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { coretoolAuth } from '../auth';
import { coretoolClient } from '../common/client';

export const checkLeitwegId = createAction({
  auth: coretoolAuth,
  name: 'check_leitweg_id',
  displayName: 'Check Leitweg-ID',
  description: 'Checks the format and check digit of a Leitweg-ID (routing ID of German public authorities).',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Use this before sending an XRechnung to a German public authority to check whether the Leitweg-ID is formally correct (structure and check digit). It does not confirm that the authority exists and changes nothing, so it is safe to repeat.',
    idempotent: true,
  },
  props: {
    leitwegId: Property.ShortText({
      displayName: 'Leitweg-ID',
      description: 'E.g. 04011000-1234512345-06.',
      required: true,
    }),
  },
  async run(context) {
    const response = await coretoolClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/leitweg/pruefen',
      what: 'Could not check the Leitweg-ID',
      body: { leitweg_id: context.propsValue.leitwegId.trim() },
    });
    return {
      valid: Boolean(response['gueltig']),
      leitweg_id: response['leitweg_id'],
      ...response,
    };
  },
});
