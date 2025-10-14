import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { capsuleCrmAuth, CapsuleCrmAuthType } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import {
  CreateProjectParams,
  OpportunityCustomField,
  OpportunityTag,
} from '../common/types';

export const createProjectAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new Project in Capsule CRM.',
  props: {
    partyId: Property.Dropdown({
      displayName: 'Party',
      description: 'The main contact for this project.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your Capsule CRM account first',
          };
        const contacts = await capsuleCrmClient.searchContacts(
          auth as CapsuleCrmAuthType,
          ''
        );
        return {
          options: contacts.map((contact) => ({
            label:
              contact.type === 'person'
                ? `${contact.firstName} ${contact.lastName}`
                : contact.name || `Unnamed ${contact.type}`,
            value: contact.id,
          })),
        };
      },
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of this project.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of this project.',
      required: false,
    }),
    opportunityId: Property.Dropdown({
      displayName: 'Opportunity',
      description:
        'An optional link to the opportunity that this project was created to support.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your Capsule CRM account first',
          };
        const opportunities = await capsuleCrmClient.searchOpportunities(
          auth as CapsuleCrmAuthType
        );
        return {
          options: opportunities.map((opportunity) => ({
            label: opportunity.name,
            value: opportunity.id,
          })),
        };
      },
    }),
    stageId: Property.Dropdown({
      displayName: 'Stage',
      description: 'The stage that this project is on.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your Capsule CRM account first',
          };
        const stages = await capsuleCrmClient.listStages(
          auth as CapsuleCrmAuthType
        );
        return {
          options: stages.map((stage) => ({
            label: stage.name,
            value: stage.id,
          })),
        };
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the project.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'OPEN' },
          { label: 'Closed', value: 'CLOSED' },
        ],
      },
    }),
    expectedCloseOn: Property.DateTime({
      displayName: 'Expected Close Date',
      description: 'The expected close date of this project.',
      required: false,
    }),
    ownerId: Property.Dropdown({
      displayName: 'Owner',
      description: 'The user this project is assigned to.',
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
    teamId: Property.Dropdown({
      displayName: 'Team',
      description: 'The team this project is assigned to.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your Capsule CRM account first',
          };
        const teams = await capsuleCrmClient.listTeams(
          auth as CapsuleCrmAuthType
        );
        return {
          options: teams.map((team) => ({
            label: team.name,
            value: team.id,
          })),
        };
      },
    }),
    tags: Property.MultiSelectDropdown({
      displayName: 'Tags',
      description: 'An array of tags that are added to this project.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            options: [],
            disabled: true,
            placeholder: 'Please connect your Capsule CRM account first',
          };
        const tags = await capsuleCrmClient.listTags(auth as CapsuleCrmAuthType);
        return {
          options: tags.map((tag) => ({
            label: tag.name,
            value: tag.name,
          })),
        };
      },
    }),
    customFields: Property.DynamicProperties({
      displayName: 'Custom Fields',
      description: 'An array of custom fields that are defined for this project.',
      required: false,
      refreshers: [],
      props: async ({ auth }) => {
        const fields: DynamicPropsValue = {};
        if (!auth) return fields;
        const customFields = await capsuleCrmClient.listCustomFields(
          auth as CapsuleCrmAuthType
        );
        for (const field of customFields) {
          switch (field.type) {
            case 'list':
              fields[field.id] = Property.StaticDropdown({
                displayName: field.name,
                required: false,
                options: {
                  options:
                    field.options?.map((option) => ({
                      label: option,
                      value: option,
                    })) || [],
                },
              });
              break;
            case 'boolean':
              fields[field.id] = Property.Checkbox({
                displayName: field.name,
                required: false,
              });
              break;
            case 'date':
              fields[field.id] = Property.DateTime({
                displayName: field.name,
                required: false,
              });
              break;
            default:
              fields[field.id] = Property.ShortText({
                displayName: field.name,
                required: false,
              });
          }
        }
        return fields;
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const projectData: CreateProjectParams = {
      party: { id: propsValue.partyId },
      name: propsValue.name,
      description: propsValue.description,
      status: propsValue.status as 'OPEN' | 'CLOSED' | undefined,
      expectedCloseOn: propsValue.expectedCloseOn,
    };

    if (propsValue.opportunityId) {
      projectData.opportunity = { id: propsValue.opportunityId };
    }
    if (propsValue.stageId) {
      projectData.stage = { id: propsValue.stageId };
    }
    if (propsValue.ownerId) {
      projectData.owner = { id: propsValue.ownerId };
    }
    if (propsValue.teamId) {
      projectData.team = { id: propsValue.teamId };
    }

    if (propsValue.tags) {
      projectData.tags = propsValue.tags.map(
        (tag) => ({ name: tag } as OpportunityTag)
      );
    }

    const customFields = propsValue.customFields as DynamicPropsValue;
    if (customFields) {
      projectData.fields = Object.entries(customFields)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(
          ([id, value]) =>
            ({
              definition: { id: Number(id) },
              value: value,
            } as OpportunityCustomField)
        );
    }

    return await capsuleCrmClient.createProject(auth, projectData);
  },
});
