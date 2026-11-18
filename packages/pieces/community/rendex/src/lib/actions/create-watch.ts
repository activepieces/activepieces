import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { rendexClient } from '../common/client';
import { RENDEX_LIMITS, rendexInput } from '../common/common';
import { rendexParams, rendexProps } from '../common/props';
import { watchOutputSchema } from '../common/output-schemas';

export const createWatch = createAction({
  auth: rendexAuth,
  name: 'create_watch',
  classification: 'WRITE',
  displayName: 'Create Watch',
  description: 'Start monitoring a web page for visual or text changes on a schedule.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a Rendex watch that checks a public page on a schedule and records a run whenever it changes visually or in text; returns the watch with its Watch ID. Use Test Watch Settings first to check the page can be captured, and the Watch Detected a Change trigger or List Watch Runs to read results. Plans cap the number of watches (Free: 1, daily checks, email alerts only). Costs one credit for the baseline capture (none when created paused); each call creates another watch.',
    idempotent: false,
  },
  outputSchema: watchOutputSchema,
  props: {
    url: Property.ShortText({ displayName: 'Page URL', description: 'The public page to monitor, like https://example.com/pricing.', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'A label for the watch (up to 120 characters).', required: false }),
    interval_minutes: Property.Number({
      displayName: 'Check Interval (minutes)',
      description: 'How often to check, 5 to 43200 minutes. Default 1440 (daily). Your plan sets the minimum: Free 1440, Basic 180, Starter 60, Pro 30.',
      required: false,
    }),
    notify_email: Property.ShortText({ displayName: 'Alert Email', description: 'Where change alerts go. Must be your Rendex account email. Leave empty for no email alerts (the watch is created with no alert email; check results with List Watch Runs or the Watch Detected a Change trigger).', required: false }),
    webhook_url: Property.ShortText({ displayName: 'Webhook URL', description: 'HTTPS URL that receives a signed request on each change (Starter plan and up).', required: false }),
    paused: rendexProps.yesNo({ displayName: 'Create Paused', description: 'Yes creates the watch paused: no baseline capture and no credit until you resume it. Default no.' }),
    ai_summary: rendexProps.yesNo({ displayName: 'AI Summary', description: 'Yes adds a one-sentence summary of what changed to each run (Pro plan and up). Default no.' }),
    ...rendexProps.watchSettingProps(),
  },
  async run(context) {
    const values: Record<string, unknown> = { ...context.propsValue };
    const { settings, renderParams } = rendexParams.watchSettings({ values });
    const body = rendexInput.compact({
      url: rendexParams.watchUrlOf({ value: values['url'] }),
      name: rendexInput.textOf({ value: values['name'], label: 'Name', maxLength: 120 }),
      intervalMinutes: rendexInput.numberOf({ value: values['interval_minutes'], ...RENDEX_LIMITS.INTERVAL }),
      notifyEmail: rendexInput.textOf({ value: values['notify_email'], label: 'Alert Email', maxLength: 320 }),
      webhookUrl: rendexInput.textOf({ value: values['webhook_url'], label: 'Webhook URL', maxLength: 2048 }),
      paused: rendexInput.flagOf({ value: values['paused'], label: 'Create Paused' }),
      aiSummary: rendexInput.flagOf({ value: values['ai_summary'], label: 'AI Summary' }),
      ...settings,
      renderParams: Object.keys(renderParams).length === 0 ? undefined : renderParams,
    });
    return rendexClient.requestData({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/watches',
      body,
      timeoutMs: RENDEX_LIMITS.RENDER_TIMEOUT_MS,
      operation: 'create the watch',
    });
  },
});
