import { Property } from '@activepieces/pieces-framework';
import { flowluCommon } from '.';

export const flowluProjectProps = {
  fields: () => ({
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    manager_id: flowluCommon.user_id(false, 'Project Manager'),
    customer_id: flowluCommon.organization_id(
      false,
      'Customer (Organization)',
      'The CRM organization the project is for.'
    ),
    customer_crm_contact_id: flowluCommon.contact_id(
      false,
      'Customer Contact',
      'The contact person at the customer.'
    ),
    crm_lead_id: flowluCommon.opportunity_id(false),
    startdate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Only the date part is used.',
      required: false,
    }),
    enddate: Property.DateTime({
      displayName: 'End Date',
      description: 'Only the date part is used.',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Low', value: 1 },
          { label: 'Medium', value: 2 },
          { label: 'High', value: 3 },
        ],
      },
    }),
    portfolio_id: flowluCommon.portfolio_id(false),
    tasks_workflow_id: flowluCommon.workflow_id(false),
    estimated_revenue: Property.Number({
      displayName: 'Contract Amount',
      description: 'Planned revenue for the project.',
      required: false,
    }),
    estimated_expenses: Property.Number({
      displayName: 'Planned Expenses',
      required: false,
    }),
  }),
};
