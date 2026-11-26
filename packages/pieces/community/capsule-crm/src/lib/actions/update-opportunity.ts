import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { opportunityOutputSchema } from '../common/output-schemas';
import {
  UpdateOpportunityParams,
  OpportunityCustomField,
  OpportunityTagInput,
} from '../common/types';

export const updateOpportunityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'update_opportunity',
  classification: 'WRITE',
  displayName: 'Update Opportunity',
  description: 'Update an existing Opportunity in Capsule CRM.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates an existing Capsule CRM opportunity identified by its opportunity ID, changing fields such as name, milestone, value, probability, duration, owner, team, tags, and custom fields. Tags and custom-field entries each support a delete flag for removal. Use when you already know the target opportunity ID; only provided fields are changed. Repeating the same call leaves the opportunity unchanged.',
    idempotent: true,
  },
  outputSchema: opportunityOutputSchema,
  props: {
    opportunityId: Property.Dropdown({
      auth: capsuleCrmAuth,
      displayName: 'Opportunity',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [], disabled: true, placeholder: "Please connect your Capsule CRM account first" };
        const opportunities = await capsuleCrmClient.searchOpportunities({ auth });
        return {
          options: opportunities.map((opportunity) => ({
            label: opportunity.name,
            value: opportunity.id,
          })),
        };
      },
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    milestoneId: Property.Dropdown({
      auth: capsuleCrmAuth,
      displayName: 'Milestone',
      description: 'Only milestones of the oldest active pipeline are listed (Capsule API limit); for other pipelines enter the milestone ID by hand.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [], disabled: true, placeholder: "Please connect your Capsule CRM account first" };
        const milestones = await capsuleCrmClient.listMilestones({ auth });
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
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
    expectedCloseOn: Property.DateTime({
      displayName: 'Expected Close Date',
      required: false,
    }),
    probability: Property.Number({
      displayName: 'Probability',
      required: false,
    }),
    durationBasis: Property.StaticDropdown({
      displayName: 'Duration Basis',
      required: false,
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
    }),
    ownerId: Property.Dropdown({
      auth: capsuleCrmAuth,
      displayName: 'Owner',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [], disabled: true, placeholder: "Please connect your Capsule CRM account first" };
        const users = await capsuleCrmClient.listUsers({ auth });
        return {
          options: users.map((user) => ({
            label: user.name,
            value: user.id,
          })),
        };
      },
    }),
    teamId: Property.Dropdown({
      auth: capsuleCrmAuth,
      displayName: 'Team',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [], disabled: true, placeholder: "Please connect your Capsule CRM account first" };
        const teams = await capsuleCrmClient.listTeams({ auth });
        return {
          options: teams.map((team) => ({
            label: team.name,
            value: team.id,
          })),
        };
      },
    }),
    tags: Property.DynamicProperties({
      auth: capsuleCrmAuth,
      displayName: 'Tags',
      required: false,
      refreshers: ['opportunityId'],
      props: async ({ auth, opportunityId }) => {
        const fields: DynamicPropsValue = {};
        if (!auth || !opportunityId) return fields;

        const opportunity = await capsuleCrmClient.getOpportunity({ auth, opportunityId });
        const tagOptions =
          opportunity.tags?.map((tag) => ({
            label: tag.name,
            value: tag.id,
          })) ?? [];

        fields['tags'] = Property.Array({
          displayName: 'Tags',
          required: false,
          properties: {
            id: Property.StaticDropdown({
              displayName: 'Tag',
              required: false,
              options: {
                options: tagOptions,
              },
            }),
            name: Property.ShortText({
              displayName: 'New Tag Name',
              description: 'Enter a name to create a new tag.',
              required: false,
            }),
            delete: Property.Checkbox({
              displayName: 'Delete',
              description: 'Check this to delete the tag.',
              required: false,
            }),
          },
        });
        return fields;
      },
    }),
    customFields: Property.DynamicProperties({
      auth: capsuleCrmAuth,
      displayName: 'Custom Fields',
      required: false,
      refreshers: ['opportunityId'],
      props: async ({ auth, opportunityId }) => {
        const fields: DynamicPropsValue = {};
        if (!auth || !opportunityId) return fields;

        const allCustomFields = await capsuleCrmClient.listCustomFields({ auth, entity: 'opportunity' });

        const customFieldOptions =
          allCustomFields?.map((field) => ({
            label: field.name,
            value: field.id,
          })) ?? [];

        fields['customFields'] = Property.Array({
          displayName: 'Custom Fields',
          required: false,
          properties: {
            definitionId: Property.StaticDropdown({
              displayName: 'Field',
              required: true,
              options: {
                options: customFieldOptions,
              },
            }),
            value: Property.ShortText({
              displayName: 'Value',
              required: true,
            }),
            delete: Property.Checkbox({
              displayName: 'Delete',
              description: 'Check this to delete the custom field value.',
              required: false,
            }),
          },
        });
        return fields;
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { opportunityId } = propsValue;

    const opportunityData: UpdateOpportunityParams = {
      name: capsuleCrmClient.optionalText(propsValue.name),
      description: capsuleCrmClient.optionalText(propsValue.description),
      expectedCloseOn: capsuleCrmClient.dayFromDateTime({ value: propsValue.expectedCloseOn, label: 'Expected Close Date' }),
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
    if (propsValue.milestoneId) {
      opportunityData.milestone = { id: propsValue.milestoneId };
    }
    const value = capsuleCrmClient.opportunityValue({ amount: propsValue.amount, currency: propsValue.currency });
    if (value !== undefined) {
      opportunityData.value = value;
    }

    const tags: OpportunityTagInput[] = recordsOf(propsValue.tags?.['tags']).flatMap((tag) => {
      const id = idOf(tag['id']);
      const name = typeof tag['name'] === 'string' ? tag['name'].trim() : '';
      if (id === undefined && name === '') {
        return [];
      }
      return [{ ...(id === undefined ? {} : { id }), ...(name === '' ? {} : { name }), ...(tag['delete'] === true ? { _delete: true } : {}) }];
    });
    if (tags.length > 0) {
      opportunityData.tags = tags;
    }

    const fields: OpportunityCustomField[] = recordsOf(propsValue.customFields?.['customFields']).flatMap((field) => {
      const definitionId = idOf(field['definitionId']);
      if (definitionId === undefined) {
        return [];
      }
      return [{ definition: { id: definitionId }, value: field['value'], ...(field['delete'] === true ? { _delete: true } : {}) }];
    });
    if (fields.length > 0) {
      opportunityData.fields = fields;
    }

    return await capsuleCrmClient.updateOpportunity({ auth, opportunityId, params: opportunityData });
  },
});

function idOf(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return undefined;
}

function recordsOf(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
}
