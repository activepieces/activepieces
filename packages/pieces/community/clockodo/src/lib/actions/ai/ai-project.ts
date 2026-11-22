import { Property, createAction } from '@activepieces/pieces-framework';
import { deletedResult, makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';
import { clockodoAiProps } from './ai-props';

const projectProps = {
  number: Property.ShortText({ displayName: 'Number', description: 'Your own project number.', required: false }),
  active: clockodoAiProps.yesNo({ displayName: 'Active', description: 'Whether the project is active.' }),
  billable: clockodoAiProps.yesNo({
    displayName: 'Billable by Default',
    description: 'Whether new entries for this project are billable by default.',
  }),
  budget: Property.Number({ displayName: 'Budget', description: 'Budget amount (money, or hours when Budget in Hours is yes).', required: false }),
  budget_is_hours: clockodoAiProps.yesNo({ displayName: 'Budget in Hours', description: 'Whether the budget is in hours instead of money.' }),
  budget_is_not_strict: clockodoAiProps.yesNo({ displayName: 'Soft Budget', description: 'Whether the budget may be exceeded.' }),
  note: Property.LongText({ displayName: 'Note', placeholder: 'e.g. Agreed by phone', required: false }),
};

export const aiCreateProject = createAction({
  auth: clockodoAuth,
  name: 'ai_create_project',
  classification: 'WRITE',
  displayName: 'Create Project',
  description: 'Creates a project in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.project,
  aiMetadata: {
    description:
      'Creates a Clockodo project under a customer (numeric customer id from Get Customers) and returns it with its id. Flags take "yes"/"no". Not idempotent: each call adds another project, so check Get Projects first.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    customer_id: clockodoAiProps.id({ displayName: 'Customer ID', source: 'Get Customers', required: true }),
    ...projectProps,
  },
  async run({ auth, propsValue }) {
    return makeClient(auth.props).createProject(
      clockodoRequests.projectCreateBody({
        name: clockodoRequests.requireValue({ value: propsValue.name.trim(), field: 'Name' }),
        customers_id: clockodoRequests.parseId({ value: propsValue.customer_id, field: 'Customer ID' }),
        number: clockodoRequests.optionalText(propsValue.number),
        active: clockodoRequests.parseYesNo({ value: propsValue.active, field: 'Active' }),
        billable_default: clockodoRequests.parseYesNo({ value: propsValue.billable, field: 'Billable by Default' }),
        budget_input: {
          amount: propsValue.budget,
          is_hours: clockodoRequests.parseYesNo({ value: propsValue.budget_is_hours, field: 'Budget in Hours' }),
          is_not_strict: clockodoRequests.parseYesNo({ value: propsValue.budget_is_not_strict, field: 'Soft Budget' }),
        },
        note: clockodoRequests.optionalText(propsValue.note),
      })
    );
  },
});

export const aiGetProject = createAction({
  auth: clockodoAuth,
  name: 'ai_get_project',
  classification: 'READ',
  displayName: 'Get Project',
  description: 'Retrieves a single project from Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.project,
  aiMetadata: {
    description: 'Returns one Clockodo project by its numeric project id (find ids with Get Projects). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    project_id: clockodoAiProps.id({ displayName: 'Project ID', source: 'Get Projects', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.project_id, field: 'Project ID' });
    return makeClient(auth.props).getProject(id);
  },
});

export const aiUpdateProject = createAction({
  auth: clockodoAuth,
  name: 'ai_update_project',
  classification: 'WRITE',
  displayName: 'Update Project',
  description: 'Updates a project in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.project,
  aiMetadata: {
    description:
      'Changes only the fields you give on a Clockodo project identified by its numeric project id, including moving it to another customer id, or marking it completed ("yes", needs at least one billable entry) or reopened ("no"), or billing complete ("yes"/"no" marks all of the project\'s entries as billed / not billed). Flags take "yes"/"no". Idempotent.',
    idempotent: true,
  },
  props: {
    project_id: clockodoAiProps.id({ displayName: 'Project ID', source: 'Get Projects', required: true }),
    customer_id: clockodoAiProps.id({ displayName: 'Customer ID', source: 'Get Customers', required: false }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    ...projectProps,
    completed: clockodoAiProps.yesNo({ displayName: 'Completed', description: 'yes completes the project, no reopens it.' }),
    billing_complete: clockodoAiProps.yesNo({ displayName: 'Billing Complete', description: 'Marks all entries of this project as billed (yes) or not billed (no).' }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.project_id, field: 'Project ID' });
    const client = makeClient(auth.props);
    const budget_input = {
      amount: propsValue.budget,
      is_hours: clockodoRequests.parseYesNo({ value: propsValue.budget_is_hours, field: 'Budget in Hours' }),
      is_not_strict: clockodoRequests.parseYesNo({ value: propsValue.budget_is_not_strict, field: 'Soft Budget' }),
    };
    const stored_budget = clockodoRequests.needsStoredBudget(budget_input) ? (await client.getProject(id)).budget : undefined;
    return client.updateProjectAndCompletion({
      id,
      request: clockodoRequests.projectUpdateBody({
        name: propsValue.name || undefined,
        customers_id: clockodoRequests.parseOptionalId({ value: propsValue.customer_id, field: 'Customer ID' }),
        number: clockodoRequests.optionalText(propsValue.number),
        active: clockodoRequests.parseYesNo({ value: propsValue.active, field: 'Active' }),
        billable_default: clockodoRequests.parseYesNo({ value: propsValue.billable, field: 'Billable by Default' }),
        budget_input,
        stored_budget,
        note: clockodoRequests.optionalText(propsValue.note),
      }),
      completed: clockodoRequests.parseYesNo({ value: propsValue.completed, field: 'Completed' }),
      billing: clockodoRequests.projectBilling({
        billed: clockodoRequests.parseYesNo({ value: propsValue.billing_complete, field: 'Billing Complete' }),
      }),
    });
  },
});

export const aiDeleteProject = createAction({
  auth: clockodoAuth,
  name: 'ai_delete_project',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Project',
  description: 'Deletes a project in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.deleted,
  aiMetadata: {
    description:
      'Permanently deletes a Clockodo project by its numeric project id. The project must be inactive first (Update Project with active "no"). Not idempotent: a second call for the same id fails because the project is gone.',
    idempotent: false,
  },
  props: {
    project_id: clockodoAiProps.id({ displayName: 'Project ID', source: 'Get Projects', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.project_id, field: 'Project ID' });
    await makeClient(auth.props).deleteProject(id);
    return deletedResult(id);
  },
});
