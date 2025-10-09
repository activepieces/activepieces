import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { capsuleCrmAuth, CapsuleCrmAuthType } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import {
  CreateOpportunityParams,
  OpportunityCustomField,
  OpportunityTag,
} from '../common/types';

export const createOpportunityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Create a new Opportunity in Capsule CRM.',
  props: {
    partyId: Property.Dropdown({
      displayName: 'Party',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [], disabled: true, placeholder: "Please connect your Capsule CRM account first" };
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
      description: 'A short description of the opportunity.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'More details about the opportunity.',
      required: false,
    }),
    milestoneId: Property.Dropdown({
      displayName: 'Milestone',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [], disabled: true, placeholder: "Please connect your Capsule CRM account first" };
        const milestones = await capsuleCrmClient.listMilestones(
          auth as CapsuleCrmAuthType
        );
        return {
          options: milestones.map((milestone) => ({
            label: milestone.name,
            value: milestone.id,
          })),
        };
      },
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The currency for the opportunity value (e.g., USD, GBP).',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The numerical value of the opportunity.',
      required: false,
    }),
    expectedCloseOn: Property.DateTime({
      displayName: 'Expected Close Date',
      description: 'The expected closing date for the opportunity.',
      required: false,
    }),
    probability: Property.Number({
      displayName: 'Probability',
      description: 'The probability of winning the opportunity.',
      required: false,
    }),
    durationBasis: Property.StaticDropdown({
      displayName: 'Duration Basis',
      required: false,
      description: 'The basis of the duration of the opportunity.',
      options: {
        options: [
          { label: 'Fixed', value: 'FIXED' },
          { label: 'Hour', value: 'HOUR' },
          { label: 'Day', value: 'DAY' },
          { label: 'Week', value: 'WEEK' },
          { label: 'Month', value: 'MONTH' },
          { label: 'Quarter', value: 'QUARTER' },
          { label: 'Year', value: 'YEAR' },
        ],
      },
    }),
    duration: Property.Number({
      displayName: 'Duration',
      required: false,
      description: 'The duration of the opportunity.',
    }),
    ownerId: Property.Dropdown({
      displayName: 'Owner',
      required: false,
      description: 'The user the opportunity is assigned to.',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [], disabled: true, placeholder: "Please connect your Capsule CRM account first" };
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
      required: false,
      description: 'The team the opportunity is assigned to.',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [], disabled: true, placeholder: "Please connect your Capsule CRM account first" };
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
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [], disabled: true, placeholder: "Please connect your Capsule CRM account first" };
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
      required: true,
      refreshers: [],
      props: async ({ auth }) => {
        const fields: DynamicPropsValue = {};
        if (!auth) return { options: [], disabled: true, placeholder: "Please connect your Capsule CRM account first" };
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

    const opportunityData: CreateOpportunityParams = {
      party: { id: propsValue.partyId },
      name: propsValue.name,
      milestone: { id: propsValue.milestoneId },
      description: propsValue.description,
      expectedCloseOn: propsValue.expectedCloseOn,
      probability: propsValue.probability,
      durationBasis: propsValue.durationBasis,
      duration: propsValue.duration,
    };

    if (propsValue.ownerId) {
      opportunityData.owner = { id: propsValue.ownerId };
    }
    if (propsValue.teamId) {
      opportunityData.team = { id: propsValue.teamId };
    }

    if (propsValue.currency && propsValue.amount) {
      opportunityData.value = {
        currency: propsValue.currency,
        amount: propsValue.amount,
      };
    }

    if (propsValue.tags) {
      opportunityData.tags = propsValue.tags.map(
        (tag) => ({ name: tag } as OpportunityTag)
      );
    }

    const customFields = propsValue.customFields as DynamicPropsValue;
    if (customFields) {
      opportunityData.fields = Object.entries(customFields)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(
          ([id, value]) =>
            ({
              definition: { id: Number(id) },
              value: value,
            } as OpportunityCustomField)
        );
    }

    return await capsuleCrmClient.createOpportunity(auth, opportunityData);
  },
});
