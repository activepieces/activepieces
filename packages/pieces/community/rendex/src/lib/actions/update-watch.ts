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

const RENDER_CLEARS = [
  { clearProp: 'clear_selector', key: 'selector', label: 'Element Selector', clearValue: '' },
  { clearProp: 'clear_hide_selectors', key: 'hideSelectors', label: 'Hide Elements', clearValue: [] },
  { clearProp: 'clear_ignore_text', key: 'ignoreText', label: 'Ignore Text', clearValue: [] },
];

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

function renderClears({ values, renderParams }: { values: Record<string, unknown>; renderParams: Record<string, unknown> }): Record<string, unknown> {
  return RENDER_CLEARS.reduce<Record<string, unknown>>((clears, { clearProp, key, label, clearValue }) => {
    const clearIt = rendexInput.flagOf({ value: values[clearProp], label: `Clear ${label}` });
    if (clearIt !== true) return clears;
    if (renderParams[key] !== undefined) {
      throw new Error(`Either set ${label} or set Clear ${label} to yes, not both.`);
    }
    return { ...clears, [key]: clearValue };
  }, {});
}

function stillSet({ watch, cleared }: { watch: Record<string, unknown>; cleared: Record<string, unknown> }): string[] {
  const saved = watch['renderParams'];
  if (typeof saved !== 'object' || saved === null) return [];
  return RENDER_CLEARS.filter(({ key }) => key in cleared)
    .filter(({ key }) => {
      const value = Reflect.get(saved, key);
      return (typeof value === 'string' && value.trim() !== '') || (Array.isArray(value) && value.length > 0);
    })
    .map(({ label }) => label);
}

export const updateWatch = createAction({
  auth: rendexAuth,
  name: 'update_watch',
  classification: 'WRITE',
  displayName: 'Update Watch',
  description: 'Change, pause or resume a website change watch. Fields you leave empty stay as they are.',
  audience: 'both',
  aiMetadata: {
    description:
      'Changes only the fields you fill on one Rendex watch; empty fields stay unchanged. Pause or Resume it with Paused, and remove the name, alert email, webhook, element selector, hidden elements or ignored text with the matching Clear option set to yes. A new Page URL resets the baseline. Render settings are merged into the existing ones. At least one change is required. Applying the same change again leaves the watch the same.',
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
    clear_selector: rendexProps.yesNo({ displayName: 'Clear Element Selector', description: 'Yes watches the whole page again instead of one element.' }),
    clear_hide_selectors: rendexProps.yesNo({ displayName: 'Clear Hide Elements', description: 'Yes stops hiding elements before each check.' }),
    clear_ignore_text: rendexProps.yesNo({ displayName: 'Clear Ignore Text', description: 'Yes stops removing text before the text comparison.' }),
  },
  async run(context) {
    const values: Record<string, unknown> = { ...context.propsValue };
    const id = rendexClient.segment({ value: values['watch_id'], label: 'Watch' });
    const { settings, renderParams } = rendexParams.watchSettings({ values });
    const cleared = renderClears({ values, renderParams });
    const allRenderParams = { ...renderParams, ...cleared };
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
      renderParams: Object.keys(allRenderParams).length === 0 ? undefined : allRenderParams,
    });
    if (Object.keys(patch).length === 0) {
      throw new Error('Nothing to update. Fill at least one field, set Paused to Pause or Resume, or set a Clear option to yes.');
    }
    const watch = await rendexClient.requestData({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: `/v1/watches/${id}`,
      body: patch,
      operation: 'update the watch',
    });
    const kept = stillSet({ watch, cleared });
    if (kept.length > 0) {
      throw new Error(`Rendex saved the other changes but kept ${kept.join(', ')}. Clear them in the Rendex dashboard.`);
    }
    return watch;
  },
});
