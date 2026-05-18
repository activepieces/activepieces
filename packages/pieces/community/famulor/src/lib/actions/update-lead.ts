import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const updateLead = createAction({
  auth: famulorAuth,
  name: 'updateLead',
  displayName: 'Update Lead',
  description: 'Update an existing lead\'s details.',
  props: famulorCommon.updateLeadProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.updateLeadSchema);

    const campaignId = propsValue.campaign as number | undefined;
    const phoneRaw = propsValue.phone_number as string | undefined;
    const status = propsValue.status as string | undefined;
    const variables = propsValue.variables as Record<string, unknown> | undefined;

    const phone = phoneRaw?.trim() ?? '';
    const hasVariables =
      variables !== undefined &&
      variables !== null &&
      typeof variables === 'object' &&
      Object.keys(variables).length > 0;

    const hasUpdate =
      campaignId != null ||
      phone !== '' ||
      (status !== undefined && status !== null && String(status).trim() !== '') ||
      hasVariables;

    if (!hasUpdate) {
      throw new Error(
        'Provide at least one field to update: campaign, phone number, status, or variables.',
      );
    }

    const statusTrimmed =
      status !== undefined && status !== null ? String(status).trim() : '';
    const statusValue =
      statusTrimmed === ''
        ? undefined
        : (statusTrimmed as 'created' | 'completed' | 'reached-max-retries');

    return await famulorCommon.updateLead({
      auth: auth.secret_text,
      lead_id: propsValue.lead_id,
      campaign_id: campaignId,
      phone_number: phone !== '' ? phone : undefined,
      status: statusValue,
      variables: hasVariables ? variables : undefined,
    });
  },
});
