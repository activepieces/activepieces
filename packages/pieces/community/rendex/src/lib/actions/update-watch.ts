import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { RENDEX_LIMITS, rendexInput } from '../common/common';
import { rendexParams, rendexProps } from '../common/props';
import { watchOutputSchema } from '../common/output-schemas';

const PAUSED_OPTIONS = [
  { label: 'Keep as is', value: 'keep' },
  { label: 'Pause', value: 'pause' },
  { label: 'Resume', value: 'resume' },
];

export const updateWatch = createAction({
  auth: rendexAuth,
  name: 'update_watch',
  classification: 'WRITE',
  displayName: 'Update Watch',
  description: 'Change, pause or resume a website change watch. Fields you leave empty stay as they are.',
  audience: 'both',
  aiMetadata: {
    description:
      'Changes only the fields you fill on one Rendex watch; empty fields stay unchanged. Pause or Resume it with Paused, and remove the name, alert email or webhook with the matching Clear option set to yes. A new Page URL resets the baseline. Render settings are merged into the existing ones. At least one change is required. Applying the same change again leaves the watch the same.',
    idempotent: true,
  },
  outputSchema: watchOutputSchema,
  props: {
    watch_id: rendexProps.watchDropdown(),
    paused: rendexProps.choice({ displayName: 'Paused', description: 'Pause or resume the watch. Default keep as is.', values: PAUSED_OPTIONS }),
    url: Property.ShortText({ displayName: 'Page URL', description: 'A new page to monitor. Changing it resets the baseline.', required: false }),
    name: Property.ShortText({ displayName: 'Name', description: 'A new label (up to 120 characters).', required: false }),
    clear_name: rendexProps.yesNo({ displayName: 'Clear Name', description: 'Yes removes the name.' }),
    interval_minutes: Property.Number({ displayName: 'Check Interval (minutes)', description: 'New check frequency, 5 to 43200 minutes (your plan sets the minimum).', required: false }),
    notify_email: Property.ShortText({ displayName: 'Alert Email', description: 'New alert email. Must be your Rendex account email.', required: false }),
    clear_notify_email: rendexProps.yesNo({ displayName: 'Clear Alert Email', description: 'Yes turns email alerts off.' }),
    webhook_url: Property.ShortText({ displayName: 'Webhook URL', description: 'New HTTPS webhook target (Starter plan and up).', required: false }),
    clear_webhook_url: rendexProps.yesNo({ displayName: 'Clear Webhook URL', description: 'Yes turns webhook alerts off.' }),
    ai_summary: rendexProps.yesNo({ displayName: 'AI Summary', description: 'Turn the one-sentence change summary on or off (Pro plan and up).' }),
    ...rendexProps.watchSettingProps(),
  },
  async run(context) {
    const values: Record<string, unknown> = { ...context.propsValue };
    const id = rendexClient.segment({ value: values['watch_id'], label: 'Watch' });
    const { settings, renderParams } = rendexParams.watchSettings({ values });
    const url = rendexInput.textOf({ value: values['url'], label: 'Page URL', maxLength: 2048 });
    const patch = rendexInput.compact({
      paused: pausedOf(values['paused']),
      url,
      name: clearable({ value: values['name'], clear: values['clear_name'], label: 'Name', maxLength: 120, clearValue: '' }),
      intervalMinutes: rendexInput.numberOf({ value: values['interval_minutes'], ...RENDEX_LIMITS.INTERVAL }),
      notifyEmail: clearable({ value: values['notify_email'], clear: values['clear_notify_email'], label: 'Alert Email', maxLength: 320, clearValue: null }),
      webhookUrl: clearable({ value: values['webhook_url'], clear: values['clear_webhook_url'], label: 'Webhook URL', maxLength: 2048, clearValue: null }),
      aiSummary: rendexInput.flagOf({ value: values['ai_summary'], label: 'AI Summary' }),
      ...settings,
      renderParams: Object.keys(renderParams).length === 0 ? undefined : renderParams,
    });
    if (Object.keys(patch).length === 0) {
      throw new Error('Nothing to update. Fill at least one field, set Paused to Pause or Resume, or set a Clear option to yes.');
    }
    return rendexClient.requestData({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: `/v1/watches/${id}`,
      body: patch,
      operation: 'update the watch',
    });
  },
});

function pausedOf(value: unknown): boolean | undefined {
  const choice = rendexInput.choiceOf({ value, label: 'Paused', allowed: PAUSED_OPTIONS.map((option) => option.value) });
  if (choice === 'pause') return true;
  if (choice === 'resume') return false;
  return undefined;
}

function clearable({ value, clear, label, maxLength, clearValue }: { value: unknown; clear: unknown; label: string; maxLength: number; clearValue: '' | null }): string | null | undefined {
  const text = rendexInput.textOf({ value, label, maxLength });
  const clearIt = rendexInput.flagOf({ value: clear, label: `Clear ${label}` });
  if (clearIt === true && text !== undefined) {
    throw new Error(`Either set ${label} or set Clear ${label} to yes, not both.`);
  }
  if (clearIt === true) return clearValue;
  return text;
}
