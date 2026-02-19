import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { gauzyAuth, gauzyWebhookCommon, GauzyWebhookInformation } from '../common';

const triggerNameInStore = 'gauzy_new_employee_trigger';

export const newEmployee = createTrigger({
  auth: gauzyAuth,
  name: 'new_employee',
  displayName: 'Gauzy Employee management',
  description: 'Triggers when a new employee is created in Gauzy',
  type: TriggerStrategy.WEBHOOK,
  props: {
    tenantId: gauzyWebhookCommon.tenantId,
    organizationId: gauzyWebhookCommon.organizationId,
    includeUserData: Property.Checkbox({
      displayName: 'Include User Data',
      required: false,
      description: 'Include detailed user information with employee data',
      defaultValue: true,
    }),
  },
  sampleData: {
    id: 'sample-employee-id',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    tenantId: 'sample-tenant-id',
    organizationId: 'sample-organization-id',
    startedWorkOn: '2024-05-01T00:00:00.000Z',
    isActive: true,
    user: {
      id: 'sample-user-id',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
  },
  async onEnable(context) {
    const webhookId = await gauzyWebhookCommon.createWebhook(
      context.auth,
      context.webhookUrl,
      context.propsValue.tenantId,
      (context.propsValue.organizationId as string) || '',
      ['employee.created']
    );
    
    await context.store.put<GauzyWebhookInformation>(triggerNameInStore, {
      webhookId: webhookId,
    });
  },
  
  async onDisable(context) {
    const response = await context.store.get<GauzyWebhookInformation>(triggerNameInStore);
    
    if (response !== null && response !== undefined) {
      await gauzyWebhookCommon.deleteWebhook(context.auth, response.webhookId);
    }
  },
  
  async run(context) {
    return [context.payload.body];
  },
});