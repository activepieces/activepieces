import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { capsuleCrmAuth, CapsuleCrmAuthType } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { CreateTaskParams } from '../common/types';

export const createTaskAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new Task in Capsule CRM.',
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
      props: async ({ auth, linkTo }) => {
        const fields: DynamicPropsValue = {};
        const linkToType = linkTo as unknown as string;
        if (!auth || !linkToType) return fields;

        if (linkToType === 'party') {
          const contacts = await capsuleCrmClient.searchContacts(
            auth as CapsuleCrmAuthType,
            ''
          );
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
          const opportunities = await capsuleCrmClient.searchOpportunities(
            auth as CapsuleCrmAuthType
          );
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
          const projects = await capsuleCrmClient.searchProjects(
            auth as CapsuleCrmAuthType
          );
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
      options: async ({ auth }) => {
        if (!auth)
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your Capsule CRM account first',
          };
        const categories = await capsuleCrmClient.listCategories(
          auth as CapsuleCrmAuthType
        );
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
      options: async ({ auth }) => {
        if (!auth)
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your Capsule CRM account first',
          };
        const users = await capsuleCrmClient.listUsers(
          auth as CapsuleCrmAuthType
        );
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
      dueOn: propsValue.dueOn,
      detail: propsValue.detail,
      dueTime: propsValue.dueTime,
    };

    if (propsValue.categoryId) {
      taskData.category = { id: propsValue.categoryId };
    }
    if (propsValue.ownerId) {
      taskData.owner = { id: propsValue.ownerId };
    }

    const linkedEntity = propsValue.linkedEntityId as DynamicPropsValue;
    if (linkedEntity) {
      if (linkedEntity['partyId']) {
        taskData.party = { id: linkedEntity['partyId'] as number };
      } else if (linkedEntity['opportunityId']) {
        taskData.opportunity = { id: linkedEntity['opportunityId'] as number };
      } else if (linkedEntity['projectId']) {
        taskData.kase = { id: linkedEntity['projectId'] as number };
      }
    }

    return await capsuleCrmClient.createTask(auth, taskData);
  },
});
