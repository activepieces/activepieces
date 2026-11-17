import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../common/client';
import { insightlyAuth, insightlyCommon } from '../common/common';
import { outputSchemas } from '../common/output-schemas';

const SAMPLE_RECORD = {
  recordId: 123456,
  objectType: 'Contacts',
  CONTACT_ID: 123456,
  FIRST_NAME: 'John',
  LAST_NAME: 'Doe',
  EMAIL_ADDRESS: 'john.doe@example.com',
  OWNER_USER_ID: 987654,
  DATE_CREATED_UTC: '2026-01-15T10:30:00.12',
  DATE_UPDATED_UTC: '2026-01-15T10:30:00.12',
};

function extractRecord(body: unknown): Record<string, unknown> | null {
  if (!insightlyUtils.isRecord(body)) {
    return null;
  }
  const inner = body['entity'];
  const record = insightlyUtils.isRecord(inner) ? inner : body;
  return Object.keys(record).length === 0 ? null : insightlyUtils.sanitizeRecord(record);
}

export const newRecord = createTrigger({
  auth: insightlyAuth,
  name: 'new_record',
  classification: 'READ',
  displayName: 'New Record',
  description: 'Fires when a new record is created in Insightly (requires webhook setup)',
  aiMetadata: {
    description: 'Fires when a new record is created in the selected Insightly object type (Contact, Lead, Opportunity, Organization, Project, Task, or Event). Each event carries the newly created record. Requires a webhook to be configured manually in Insightly Workflow Automation for the chosen object type.',
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: outputSchemas['webhookRecord'],
  props: {
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to monitor for new records',
      required: true,
      options: {
        options: [
          { label: 'Contact', value: 'Contacts' },
          { label: 'Lead', value: 'Leads' },
          { label: 'Opportunity', value: 'Opportunities' },
          { label: 'Organization', value: 'Organisations' },
          { label: 'Project', value: 'Projects' },
          { label: 'Task', value: 'Tasks' },
          { label: 'Event', value: 'Events' },
        ],
      },
    }),
    webhookUrl: Property.MarkDown({
      value: `
**Webhook URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
**Instructions:**
1.  Go to **System Settings > Workflow Automation** in your Insightly account (Professional plan or higher).
2.  Create a new Workflow Process for the desired **Object Type**.
3.  Set the trigger to **"When a record is created"**.
4.  Under "Immediate Actions," add a new action and select **"Add New Webhook"**.
5.  Paste the webhook URL above into the **URI** field and save the workflow.
            `,
    }),
  },
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const record = extractRecord(context.payload.body);
    if (!record) {
      return [];
    }
    return [{ ...record, recordId: insightlyUtils.readNumber(insightlyCommon.recordIdOf({ record, objectName: insightlyCommon.ensureObject(context.propsValue.objectType) })), objectType: context.propsValue.objectType }];
  },
  async test(context) {
    return [{ ...SAMPLE_RECORD, objectType: context.propsValue.objectType }];
  },
  sampleData: SAMPLE_RECORD,
});
