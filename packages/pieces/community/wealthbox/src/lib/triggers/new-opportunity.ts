import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod
} from '@activepieces/pieces-common';
import {
  pollingHelper,
  DedupeStrategy,
  Polling
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { fetchUsers, fetchContacts, fetchProjects, fetchOpportunities, fetchOpportunityStages, WEALTHBOX_API_BASE, handleApiError } from '../common';

const polling: Polling<any, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS, auth }) => {
    if (!auth) {
      throw new Error('Authentication is required');
    }

    const searchParams = new URLSearchParams();

    searchParams.append('limit', '100');

    if (propsValue.resource_type) searchParams.append('resource_type', propsValue.resource_type);

    const resourceRecord = (propsValue as any).resource_record;
    if (resourceRecord?.resource_id) {
      searchParams.append('resource_id', resourceRecord.resource_id.toString());
    }

    if (propsValue.stage) searchParams.append('stage', propsValue.stage);
    if (propsValue.manager) searchParams.append('manager', propsValue.manager);

    if (propsValue.include_closed) {
      searchParams.append('include_closed', 'true');
    }

    if (propsValue.min_probability !== undefined) searchParams.append('min_probability', propsValue.min_probability.toString());
    if (propsValue.max_probability !== undefined) searchParams.append('max_probability', propsValue.max_probability.toString());

    if (propsValue.target_close_after) searchParams.append('target_close_after', dayjs(propsValue.target_close_after).toISOString());
    if (propsValue.target_close_before) searchParams.append('target_close_before', dayjs(propsValue.target_close_before).toISOString());

    searchParams.append('order', 'created');

    if (lastFetchEpochMS) {
      const lastFetchDate = dayjs(lastFetchEpochMS - 1000).toISOString();
      searchParams.append('updated_since', lastFetchDate);
    }

    const queryString = searchParams.toString();
    const url = queryString ? `${WEALTHBOX_API_BASE}/opportunities?${queryString}` : `${WEALTHBOX_API_BASE}/opportunities`;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: url,
        headers: {
          'ACCESS_TOKEN': auth as unknown as string,
          'Accept': 'application/json'
        }
      });

      if (response.status >= 400) {
        handleApiError('poll new opportunities', response.status, response.body);
      }

      const opportunities = response.body.opportunities || [];

      const newOpportunities = opportunities.filter((opportunity: any) => {
        if (!lastFetchEpochMS) return true;

        const opportunityCreatedAt = dayjs(opportunity.created_at).valueOf();
        return opportunityCreatedAt > lastFetchEpochMS;
      });

      return newOpportunities.map((opportunity: any) => ({
        epochMilliSeconds: dayjs(opportunity.created_at).valueOf(),
        data: opportunity
      }));
    } catch (error) {
      throw new Error(`Failed to poll new opportunities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export const newOpportunity = createTrigger({
  name: 'new_opportunity',
  displayName: 'New Opportunity',
  description: 'Fires when a new opportunity is created',
  type: TriggerStrategy.POLLING,
  props: {
    resource_type: Property.StaticDropdown({
      displayName: 'Linked Resource Type',
      description: 'Only trigger for opportunities linked to this type of resource (optional)',
      required: false,
      options: {
        options: [
          { label: 'Contact', value: 'Contact' },
          { label: 'Project', value: 'Project' }
        ]
      }
    }),

    resource_record: Property.DynamicProperties({
      displayName: 'Linked Resource',
      description: 'Select the specific resource to filter opportunities by',
      required: false,
      refreshers: ['resource_type'],
      props: async ({ auth, resource_type }) => {
        if (!auth || !resource_type) {
          return {
            resource_id: Property.Number({
              displayName: 'Resource ID',
              description: 'Enter the resource ID manually',
              required: false
            })
          };
        }

        try {
          let records: any[] = [];
          let recordType = '';

          const resourceTypeValue = resource_type as unknown as string;

          switch (resourceTypeValue) {
            case 'Contact':
              records = await fetchContacts(auth as unknown as string, { active: true, order: 'recent' });
              recordType = 'Contact';
              break;
            case 'Project':
              records = await fetchProjects(auth as unknown as string);
              recordType = 'Project';
              break;
            default:
              return {
                resource_id: Property.Number({
                  displayName: 'Resource ID',
                  description: 'Enter the resource ID manually',
                  required: false
                })
              };
          }

          const recordOptions = records.map((record: any) => ({
            label: record.name || record.title || `${recordType} ${record.id}`,
            value: record.id
          }));

          return {
            resource_id: Property.StaticDropdown({
              displayName: `${recordType} Record`,
              description: `Select the ${recordType.toLowerCase()} to filter opportunities by`,
              required: false,
              options: {
                options: recordOptions
              }
            })
          };
        } catch (error) {
          console.error('Error loading resource records:', error);
          return {
            resource_id: Property.Number({
              displayName: 'Resource ID',
              description: 'Enter the resource ID manually (API unavailable)',
              required: false
            })
          };
        }
      }
    }),

    stage: Property.Dropdown({
      displayName: 'Opportunity Stage',
      description: 'Only trigger for opportunities in this stage (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const stages = await fetchOpportunityStages(auth as unknown as string);
          return {
            options: stages.map((stage: any) => ({
              label: stage.name || `Stage ${stage.id}`,
              value: stage.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load opportunity stages. Please check your authentication.'
          };
        }
      }
    }),

    manager: Property.Dropdown({
      displayName: 'Opportunity Manager',
      description: 'Only trigger for opportunities managed by this user (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const users = await fetchUsers(auth as unknown as string);
          const assignableUsers = users.filter((user: any) => !user.excluded_from_assignments);
          return {
            options: assignableUsers.map((user: any) => ({
              label: `${user.name} (${user.email})`,
              value: user.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load users. Please check your authentication.'
          };
        }
      }
    }),

    include_closed: Property.Checkbox({
      displayName: 'Include Closed Opportunities',
      description: 'Include won and lost opportunities in results',
      required: false,
      defaultValue: false
    }),

    min_probability: Property.Number({
      displayName: 'Minimum Probability (%)',
      description: 'Only trigger for opportunities with probability at or above this percentage (0-100)',
      required: false
    }),

    max_probability: Property.Number({
      displayName: 'Maximum Probability (%)',
      description: 'Only trigger for opportunities with probability at or below this percentage (0-100)',
      required: false
    }),

    target_close_after: Property.DateTime({
      displayName: 'Target Close After',
      description: 'Only trigger for opportunities with target close date on or after this date/time',
      required: false
    }),

    target_close_before: Property.DateTime({
      displayName: 'Target Close Before',
      description: 'Only trigger for opportunities with target close date on or before this date/time',
      required: false
    })
  },
  sampleData: {
    id: 1,
    creator: 1,
    created_at: '2015-05-24 10:00 AM -0400',
    updated_at: '2015-10-12 11:30 PM -0400',
    name: 'Financial Plan',
    description: 'Opportunity to plan for...',
    target_close: '2015-11-12 11:00 AM -0500',
    probability: 70,
    stage: 1,
    manager: 1,
    amounts: [
      {
        amount: 56.76,
        currency: '$',
        kind: 'Fee'
      }
    ],
    linked_to: [
      {
        id: 1,
        type: 'Contact',
        name: 'Kevin Anderson'
      }
    ],
    visible_to: 'Everyone',
    custom_fields: [
      {
        id: 1,
        name: 'My Field',
        value: '123456789',
        document_type: 'Contact',
        field_type: 'single_select'
      }
    ]
  },

  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      propsValue: context.propsValue,
      auth: context.auth
    });
  },

  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      propsValue: context.propsValue,
      auth: context.auth
    });
  },

  run: async (context) => {
    return await pollingHelper.poll(polling, context);
  },

  test: async (context) => {
    return await pollingHelper.test(polling, context);
  },
});