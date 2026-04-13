import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';
import type { CampaignWeekday } from '../common/types';

export const createCampaign = createAction({
  auth: famulorAuth,
  name: 'createCampaign',
  displayName: 'Create Campaign',
  description: 'Create a new outbound calling campaign.',
  props: famulorCommon.createCampaignProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.createCampaignSchema);

    const timezone = propsValue.timezone as string | undefined;
    const goalVar = propsValue.goal_completion_variable as string | undefined;

    return await famulorCommon.createCampaign({
      auth: auth.secret_text,
      name: propsValue.name as string,
      assistant_id: propsValue.assistant_id as number,
      timezone: timezone?.trim() ? timezone.trim() : undefined,
      max_calls_in_parallel: propsValue.max_calls_in_parallel as number | undefined,
      allowed_hours_start_time: propsValue.allowed_hours_start_time as string | undefined,
      allowed_hours_end_time: propsValue.allowed_hours_end_time as string | undefined,
      allowed_days: propsValue.allowed_days as CampaignWeekday[] | undefined,
      max_retries: propsValue.max_retries as number | undefined,
      retry_interval: propsValue.retry_interval as number | undefined,
      retry_on_voicemail: propsValue.retry_on_voicemail as boolean | undefined,
      retry_on_goal_incomplete: propsValue.retry_on_goal_incomplete as boolean | undefined,
      goal_completion_variable: goalVar?.trim() ? goalVar.trim() : undefined,
      mark_complete_when_no_leads: propsValue.mark_complete_when_no_leads as
        | boolean
        | undefined,
      phone_number_ids: propsValue.phone_number_ids as number[] | undefined,
    });
  },
});
