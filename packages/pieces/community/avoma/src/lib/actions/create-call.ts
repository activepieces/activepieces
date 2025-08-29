import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { avomaAuth, avomaCommon } from '../common';

export const createCall = createAction({
  auth: avomaAuth,
  name: 'createCall',
  displayName: 'Create Call',
  description: 'Creates a new call.',
  props: avomaCommon.createCallProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(propsValue, avomaCommon.createCallSchema);

    const associations = (() => {
      const a = propsValue.associations as unknown as
        | {
            object?: Array<{ id: string; type: string }>;
            system?: string;
          }
        | undefined;
      if (a && Array.isArray(a.object) && typeof a.system === 'string') {
        return { object: a.object, system: a.system };
      }
      return undefined;
    })();

    const call = {
      additional_details: propsValue.additionalDetails
        ? JSON.stringify(propsValue.additionalDetails)
        : undefined,
      answered: propsValue.answered,
      associations,
      direction: propsValue.direction ?? null,
      end_at: propsValue.endAt ?? null,
      external_id: propsValue.externalId,
      frm: propsValue.frm ?? null,
      frm_name: propsValue.frmName,
      is_voicemail: propsValue.isVoiceMail ?? false,
      participants:
        (
          propsValue.participants as Array<{ email: string; name?: string }>
        )?.map((p) => ({ email: p.email, name: p.name })) ?? [],
      recording_url: propsValue.recordingUrl ?? null,
      source: propsValue.source ?? null,
      start_at: propsValue.startAt ?? null,
      to: propsValue.to ?? null,
      to_name: propsValue.toName,
      user_email: propsValue.userEmail,
    };

    return await avomaCommon.createCall({ apiKey, ...call });
  },
});
