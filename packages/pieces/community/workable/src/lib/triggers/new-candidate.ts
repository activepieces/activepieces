import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { accountSubdomainProp } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { WEBHOOK_INSTRUCTIONS, WebhookConfig, workableWebhook } from '../common/webhooks';
import { candidateSample } from './sample';

const config: WebhookConfig = {
  event: 'candidate_created',
  storeKey: '_new_candidate_created',
  deliveriesKey: '_new_candidate_created_deliveries',
};

export const newCandidate = createTrigger({
  auth: workableAuth,
  name: 'newCandidate',
  classification: 'READ',
  displayName: 'New Candidate',
  description: 'Triggers when a new candidate is added. Can be filtered by job and pipeline stage.',
  aiMetadata: {
    description:
      'Fires once for each new Workable candidate (candidate_created event), for applications and sourced candidates alike. Can be limited to one job shortcode and/or one stage slug. Deliveries are checked against the X-Workable-Signature HMAC.',
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
      description: "Stage slug, for example 'applied'. Leave empty to trigger for all stages.",
      required: false,
    }),
  },
  sampleData: { ...candidateSample, event_type: 'candidate_created', fired_at: '2026-10-20T09:15:02Z' },
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
