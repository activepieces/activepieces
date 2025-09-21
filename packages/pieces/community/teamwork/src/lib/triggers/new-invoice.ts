import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const newInvoiceTrigger = createTrigger({
  auth: teamworkAuth,
  name: 'new_invoice',
  displayName: 'New Invoice',
  description: 'Fires when a new invoice is created.',
  props: {
    project_id: teamworkProps.project_id(false),
  },
  sampleData: {
    "project-id": "1149",
    "exported-by-user-id": "",
    "created-by-user-firstname": "Daniel",
    "description": "New machinery as Clark dropped the last tractor",
    "fixed-cost": "",
    "status": "active",
    "date-created": "2025-06-17T12:00:47Z",
    "exported-by-user-lastname": "",
    "company-id": "51",
    "number": "INV00001",
    "exported-by-user-firstname": "",
    "po-number": "PO00002",
    "project-name": "API Private Items",
    "display-date": "20250617",
    "exported-date": "",
    "created-by-user-id": "414",
    "update-by-user-id": "414",
    "created-by-user-lastname": "Mackey",
    "company-name": "Kent Farms",
    "id": "49",
    "date-updated": "2025-06-17T12:00:47Z",
    "edited-by-user-lastname": "Mackey",
    "edited-by-user-firstname": "Daniel",
    "currency-code": "USD"
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const auth = context.auth as TeamworkAuth;
    const projectId = context.propsValue.project_id;
    const invoices = await teamworkClient.getInvoices(auth, projectId as string);
    await context.store.put('lastCheckDate', new Date().toISOString());
    await context.store.put('invoices', invoices);
  },
  async onDisable(context) {

  },
  async run(context) {
    const auth = context.auth as TeamworkAuth;
    const lastCheckDate = await context.store.get<string>('lastCheckDate');
    const projectId = context.propsValue.project_id;

    const newInvoices = await teamworkClient.getInvoices(auth, projectId as string);
    

    let latestInvoices = newInvoices;
    if (lastCheckDate) {
        latestInvoices = newInvoices.filter(invoice => {
            return new Date(invoice['date-created']) > new Date(lastCheckDate);
        });
    }


    if (latestInvoices.length > 0) {
      await context.store.put('lastCheckDate', latestInvoices[0]['date-created']);
    }
    
    return latestInvoices;
  },
});