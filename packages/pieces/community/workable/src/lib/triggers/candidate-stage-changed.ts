import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { accountSubdomainProp } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { WEBHOOK_INSTRUCTIONS, WebhookConfig, workableWebhook } from '../common/webhooks';
import { candidateSample } from './sample';

const config: WebhookConfig = {
  event: 'candidate_moved',
  storeKey: '_candidate_stage_changed',
  deliveriesKey: '_candidate_stage_changed_deliveries',
};

export const candidateStageChanged = createTrigger({
  auth: workableAuth,
  name: 'candidate_stage_changed',
  classification: 'READ',
  displayName: 'Candidate Stage Changed',
  description: 'Triggers when a candidate is moved to another stage. Can be filtered by job and target stage.',
  aiMetadata: {
    description:
      'Fires once each time a Workable candidate is moved to another pipeline stage (candidate_moved event). The payload is the candidate as it is when Workable sends it, with the new stage. Can be limited to one job shortcode and/or one target stage slug. Deliveries are checked against the X-Workable-Signature HMAC.',
  },
  props: {
    instructions: Property.MarkDown({ value: WEBHOOK_INSTRUCTIONS }),
    account_subdomain: accountSubdomainProp,
    shortcode: Property.ShortText({
      displayName: 'Job Shortcode',
      description: 'Shortcode of a job. Leave empty to trigger for all jobs.',
      required: false,
    }),
    stage_slug: Property.ShortText({
      displayName: 'Stage Slug',
      description: "Stage slug, for example 'applied'. Only moves into this stage. Leave empty to trigger for all stages.",
      required: false,
    }),
  },
  sampleData: { ...candidateSample, stage: 'Phone Screen', updated_at: '2026-10-21T14:02:00Z', event_type: 'candidate_moved', fired_at: '2026-10-21T14:02:01Z' },
  outputSchema: workableSchemas.candidateWebhook,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await workableWebhook.enable({
      auth: context.auth,
      subdomain: context.propsValue.account_subdomain,
      webhookUrl: context.webhookUrl,
      store: context.store,
      config,
      filters: { jobShortcode: context.propsValue.shortcode, stageSlug: context.propsValue.stage_slug },
    });
  },
  async onDisable(context) {
    await workableWebhook.disable({ auth: context.auth, subdomain: context.propsValue.account_subdomain, store: context.store, config });
  },
  async test(context) {
    return workableWebhook.sample({
      auth: context.auth,
      subdomain: context.propsValue.account_subdomain,
      config,
      filters: { jobShortcode: context.propsValue.shortcode, stageSlug: context.propsValue.stage_slug },
    });
  },
  async run(context) {
    const delivery = await workableWebhook.receive({ auth: context.auth, payload: context.payload, store: context.store, config, nowMs: Date.now() });
    return delivery === undefined ? [] : [delivery];
  },
});
