import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { flowluAuth } from '../auth';
import { flowluPollingHooks } from '../common/polling-trigger';
import { projectOutputSchema } from '../output-schemas';

export const newProjectTrigger = createTrigger({
  auth: flowluAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Triggers when a new project is created.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once for each new Flowlu project created after the trigger was turned on. Each run carries one project record.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  ...flowluPollingHooks({
    source: { module: 'st', entity: 'projects' },
    filters: () => ({}),
  }),
  outputSchema: projectOutputSchema,
  sampleData: {
    id: 3,
    name: 'AP-TEST-Proj-AI',
    description: 'test',
    manager_id: 1,
    customer_id: 18,
    customer_crm_contact_id: 19,
    crm_lead_id: 8,
    project_type_id: 0,
    briefcase_id: 1,
    tasks_workflow_id: 1,
    priority: 3,
    startdate: '2026-10-01',
    enddate: '2026-12-31',
    estimated_revenue: 15000,
    estimated_expenses: 4000,
    is_archive: 0,
    created_date: '2026-10-01 07:03:28',
    updated_date: '2026-10-01 07:04:06',
  },
});
