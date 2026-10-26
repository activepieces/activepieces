import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';
import { netlifyWebhook } from '../common/webhook';

export const newFormSubmission = createTrigger({
  auth: netlifyAuth,
  name: 'new_form_submission',
  classification: 'READ',
  displayName: 'New Form Submission',
  description: 'Fires when a Netlify form submission is received.',
  aiMetadata: {
    description: 'Fires when a new form submission is received on the selected Netlify site (the submission_created event); the payload includes the submitted field data and submitter metadata. Use it to process or route contact/lead form entries.',
  },
  props: {
    siteId: netlifyProps.siteDropdown({ description: 'Select the site to watch for form submissions.' }),
  },
  outputSchema: netlifySchemas.submission,
  sampleData: {
    id: '6ad0b4e91ce51d8e89ca3433',
    number: 1,
    title: 'John Doe',
    email: 'user@example.com',
    name: 'John Doe',
    first_name: 'John',
    last_name: 'Doe',
    company: null,
    summary: '<strong>John Doe</strong> Hello, I am interested in your services.',
    body: 'Hello, I am interested in your services.',
    data: {
      name: 'John Doe',
      email: 'user@example.com',
      message: 'Hello, I am interested in your services.',
      ip: '203.0.113.10',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      referrer: 'https://my-site.netlify.app/contact',
    },
    created_at: '2026-10-15T11:11:37.106Z',
    human_fields: {
      Name: 'John Doe',
      Email: 'user@example.com',
      Message: 'Hello, I am interested in your services.',
    },
    ordered_human_fields: [
      { title: 'Name', name: 'name', value: 'John Doe' },
      { title: 'Email', name: 'email', value: 'user@example.com' },
      { title: 'Message', name: 'message', value: 'Hello, I am interested in your services.' },
    ],
    form_id: '6ad0b4a19f1eec19a8db9237',
    form_name: 'contact',
    site_url: 'https://my-site.netlify.app',
    site_name: 'my-site',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await netlifyWebhook.enable({ auth: context.auth, siteId: context.propsValue.siteId, event: 'submission_created', webhookUrl: context.webhookUrl, store: context.store });
  },
  async onDisable(context) {
    await netlifyWebhook.disable({ auth: context.auth, store: context.store });
  },
  async run(context) {
    return netlifyWebhook.receive({ payload: context.payload, store: context.store });
  },
});
