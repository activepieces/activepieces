import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { taskOutputSchema } from '../common/output-schemas';
import { CreateTaskParams } from '../common/types';

export const createTaskAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Create a new Task in Capsule CRM.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new task in Capsule CRM with a description and due date, optionally linked to exactly one entity chosen via the Link To selector (a party/contact, an opportunity, or a project). Use to schedule a to-do or follow-up. Not idempotent: each call creates a separate task, so repeating it produces duplicates.',
    idempotent: false,
  },
  outputSchema: taskOutputSchema,
  props: {
    description: Property.ShortText({
      displayName: 'Description',
      description: 'A short description of the task.',
      required: true,
    }),
    dueOn: Property.DateTime({
      displayName: 'Due Date',
      description: 'The date when this task is due.',
      required: true,
    }),
    detail: Property.LongText({
      displayName: 'Details',
      description: 'More details about the task.',
      required: false,
    }),
    dueTime: Property.ShortText({
      displayName: 'Due Time',
      description:
        "The time when this task is due (e.g., 18:00:00). Note: The time is in the user's timezone.",
      required: false,
    }),
    linkTo: Property.StaticDropdown({
      displayName: 'Link To',
      description:
        'The entity this task is linked to. Only one can be selected.',
      required: false,
      options: {
        options: [
          { label: 'Party (Contact)', value: 'party' },
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Project', value: 'project' },
        ],
      },
    }),
    linkedEntityId: Property.DynamicProperties({
      displayName: 'Linked Entity',
      required: false,
      refreshers: ['linkTo'],
      auth: capsuleCrmAuth,
      props: async ({ auth, linkTo }) => {
        const fields: DynamicPropsValue = {};
        const linkToType: unknown = linkTo;
        if (!auth || !linkToType) return fields;

        if (linkToType === 'party') {
          const contacts = await capsuleCrmClient.searchContacts({ auth });
          const contactOptions = contacts.map((contact) => ({
            label:
              contact.type === 'person'
                ? `${contact.firstName} ${contact.lastName}`
                : contact.name || `Unnamed ${contact.type}`,
            value: contact.id,
          }));
          fields['partyId'] = Property.StaticDropdown({
            displayName: 'Party',
            required: true,
            options: {
              options: contactOptions,
            },
          });
        } else if (linkToType === 'opportunity') {
          const opportunities = await capsuleCrmClient.searchOpportunities({ auth });
          const opportunityOptions = opportunities.map((opportunity) => ({
            label: opportunity.name,
            value: opportunity.id,
          }));
          fields['opportunityId'] = Property.StaticDropdown({
            displayName: 'Opportunity',
            required: true,
            options: {
              options: opportunityOptions,
            },
          });
        } else if (linkToType === 'project') {
          const projects = await capsuleCrmClient.searchProjects({ auth });
          const projectOptions = projects.map((project) => ({
            label: project.name,
            value: project.id,
          }));
          fields['projectId'] = Property.StaticDropdown({
            displayName: 'Project',
            required: true,
            options: {
              options: projectOptions,
            },
          });
        }
        return fields;
      },
    }),
    categoryId: Property.Dropdown({
      displayName: 'Category',
      description: 'The category of this task.',
      required: false,
      refreshers: [],
      auth: capsuleCrmAuth,
      options: async ({ auth }) => {
        if (!auth)
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your Capsule CRM account first',
          };
        const categories = await capsuleCrmClient.listCategories({ auth });
        return {
          options: categories.map((category) => ({
            label: category.name,
            value: category.id,
          })),
        };
      },
    }),
    ownerId: Property.Dropdown({
      displayName: 'Owner',
      description: 'The user this task is assigned to.',
      required: false,
      refreshers: [],
      auth: capsuleCrmAuth,
      options: async ({ auth }) => {
        if (!auth)
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your Capsule CRM account first',
          };
        const users = await capsuleCrmClient.listUsers({ auth });
        return {
          options: users.map((user) => ({
            label: user.name,
            value: user.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const taskData: CreateTaskParams = {
      description: propsValue.description,
      dueOn: capsuleCrmClient.dayFromDateTime({ value: propsValue.dueOn, label: 'Due Date' }) ?? '',
      detail: capsuleCrmClient.optionalText(propsValue.detail),
      dueTime: propsValue.dueTime,
    };

    if (propsValue.categoryId) {
      taskData.category = { id: propsValue.categoryId };
    }
    if (propsValue.ownerId) {
      taskData.owner = { id: propsValue.ownerId };
    }

    const linkedEntity = propsValue.linkedEntityId ?? {};
    const partyId = strictId({ value: linkedEntity['partyId'], label: 'Party' });
    const opportunityId = strictId({ value: linkedEntity['opportunityId'], label: 'Opportunity' });
    const projectId = strictId({ value: linkedEntity['projectId'], label: 'Project' });
    if (propsValue.linkTo && partyId === undefined && opportunityId === undefined && projectId === undefined) {
      throw new Error('Link To is set but no linked record was selected.');
    }
    if (partyId !== undefined) {
      taskData.party = { id: partyId };
    } else if (opportunityId !== undefined) {
      taskData.opportunity = { id: opportunityId };
    } else if (projectId !== undefined) {
      taskData.kase = { id: projectId };
    }

    return await capsuleCrmClient.createTask({ auth, params: taskData });
  },
});

function strictId({ value, label }: { value: unknown; label: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  throw new Error(`${label} ID must be a numeric Capsule CRM ID; got "${String(value).slice(0, 50)}".`);
}
