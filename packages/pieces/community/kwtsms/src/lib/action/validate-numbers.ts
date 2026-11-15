// 2026-11-16 +03: Validate Numbers action (POST /API/validate/): OK / ER (format) / NR (no route) buckets.
import { createAction } from '@activepieces/pieces-framework';
import { kwtsmsAuth } from '../auth';
import { callKwtsms } from '../common';
import { chunkPhones, normalizePhones } from '../common/normalize';
import { kwtsmsProps } from '../common/props';

type ValidateResponse = { mobile?: { OK?: string[]; ER?: string[]; NR?: string[] } };

export const kwtsmsValidateNumbers = createAction({
  auth: kwtsmsAuth,
  name: 'validate_numbers',
  classification: 'READ',
  description: 'Check numbers for valid format and an available route before sending.',
  audience: 'both',
  aiMetadata: {
    description:
      'Checks mobile numbers with kwtSMS and returns three lists: ok (valid and routable), er (bad format) and nr (no route, country not activated). Numbers are cleaned first. Read-only, sends nothing, charges nothing.',
    idempotent: true,
  },
  displayName: 'Validate Numbers',
  props: {
    mobile: kwtsmsProps.mobiles('Numbers to check, e.g. 965XXXXXXXX.'),
  },
  async run(context) {
    const phones = normalizePhones(context.propsValue.mobile);
    if (phones.length === 0) {
      throw new Error('ERR006: No valid numbers submitted.');
    }
    const ok: string[] = [];
    const er: string[] = [];
    const nr: string[] = [];
    for (const batch of chunkPhones(phones)) {
      const res = await callKwtsms<ValidateResponse>(
        'validate',
        context.auth.props,
        { mobile: batch.join(',') },
      );
      ok.push(...(res.mobile?.OK ?? []));
      er.push(...(res.mobile?.ER ?? []));
      nr.push(...(res.mobile?.NR ?? []));
    }
    return { result: 'OK', ok, er, nr };
  },
});
