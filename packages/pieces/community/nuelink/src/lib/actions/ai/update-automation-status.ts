import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkClient } from '../../common/client';
import { nuelinkInputs } from '../../common/inputs';

export const aiUpdateAutomationStatus = createAction({
  name: 'nuelink_update_automation_status',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Pause or Activate Feed Automation',
  description: 'Pauses a feed automation, or activates it again.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets a feed automation (id from nuelink_list_automations) to PAUSED, which stops importing, or ACTIVE, which resumes importing new feed items into its collection. Pausing is the only way to stop an automation through the API. The response may read INACTIVE for a paused automation. Setting the same status again changes nothing.',
    idempotent: true,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    automationId: nuelinkAiProps.idText({ displayName: 'Automation ID', description: 'The numeric automation ID from nuelink_list_automations.', required: true }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      options: { options: [{ label: 'Paused', value: 'PAUSED' }, { label: 'Active', value: 'ACTIVE' }] },
    }),
  },
  outputSchema: nuelinkOutputSchemas.automationStatus,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    const automationId = nuelinkClient.numericId({ value: context.propsValue.automationId, label: 'Automation ID' });
    const status = nuelinkInputs.oneOf({ value: context.propsValue.status, label: 'Status', allowed: ['PAUSED', 'ACTIVE'] as const });
    if (status === undefined) {
      throw new Error('Status is required: PAUSED or ACTIVE.');
    }
    return nuelinkClient.request({ apiKey, method: HttpMethod.PATCH, path: ['brands', brandId, 'automations', automationId], body: { status } });
  },
});
