import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { capsuleCrmAuth, CapsuleCrmAuthType } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import {
  UpdateOpportunityParams,
  OpportunityCustomField,
  OpportunityTag,
} from '../common/types';

export const updateOpportunityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'update_opportunity',
  displayName: 'Update Opportunity',
  description: 'Update an existing Opportunity in Capsule CRM.',
  props: {
    opportunityId: Property.Dropdown({
      displayName: 'Opportunity',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [], disabled: true, placeholder: "Please connect your Capsule CRM account first" };
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
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    milestoneId: Property.Dropdown({
      displayName: 'Milestone',
      required: false,
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
      displayName: 'Owner',
      required: false,
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
    tags: Property.DynamicProperties({
      displayName: 'Tags',
      required: false,
      refreshers: ['opportunityId'],
      props: async ({ auth, opportunityId }) => {
        const fields: DynamicPropsValue = {};
        if (!auth || !opportunityId) return { options: [], disabled: true, placeholder: "Please connect your Capsule CRM account first or select an opportunity" };

        const opportunity = await capsuleCrmClient.getOpportunity(
          auth as CapsuleCrmAuthType,
          opportunityId as unknown as number
        );
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
      displayName: 'Custom Fields',
      required: false,
      refreshers: ['opportunityId'],
      props: async ({ auth, opportunityId }) => {
        const fields: DynamicPropsValue = {};
        if (!auth || !opportunityId) return { options: [], disabled: true, placeholder: "Please connect your Capsule CRM account first or select an opportunity" };

        const opportunity = await capsuleCrmClient.getOpportunity(
          auth as CapsuleCrmAuthType,
          opportunityId as unknown as number
        );
        const allCustomFields = await capsuleCrmClient.listCustomFields(
          auth as CapsuleCrmAuthType
        );

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
      name: propsValue.name,
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
    if (propsValue.milestoneId) {
      opportunityData.milestone = { id: propsValue.milestoneId };
    }
    if (propsValue.currency && propsValue.amount) {
      opportunityData.value = {
        currency: propsValue.currency,
        amount: propsValue.amount,
      };
    }

    const tags = (propsValue.tags as { tags: OpportunityTag[] })?.tags;
    if (tags) {
      opportunityData.tags = tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        _delete: tag._delete,
      }));
    }

    const customFields = (
      propsValue.customFields as {
        customFields: { definitionId: number; value: unknown; delete: boolean }[];
      }
    )?.customFields;
    if (customFields) {
      opportunityData.fields = customFields.map((field) => ({
        definition: { id: field.definitionId },
        value: field.value,
        _delete: field.delete,
      }));
    }

    return await capsuleCrmClient.updateOpportunity(
      auth,
      opportunityId,
      opportunityData
    );
  },
});
