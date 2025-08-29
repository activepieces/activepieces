import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const newOpportunity = createTrigger({
  name: 'new_opportunity',
  displayName: 'New Opportunity',
  description: 'Fires when a new opportunity is created',
  props: {
    resource_type: Property.StaticDropdown({
      displayName: 'Resource Type',
      description: 'Filter opportunities by resource type',
      required: false,
      options: {
        options: [
          { label: 'Contact', value: 'Contact' },
          { label: 'Household', value: 'Household' },
          { label: 'Project', value: 'Project' },
        ],
      },
    }),
    include_closed: Property.Checkbox({
      displayName: 'Include Closed Opportunities',
      description: 'Include won and lost opportunities in results',
      required: false,
      defaultValue: false,
    }),
    stage: Property.Number({
      displayName: 'Stage ID',
      description: 'Filter opportunities by stage ID',
      required: false,
    }),
    manager: Property.Number({
      displayName: 'Manager ID',
      description: 'Filter opportunities by manager ID',
      required: false,
    }),
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
        kind: 'Fee',
      },
    ],
    linked_to: [
      {
        id: 1,
        type: 'Contact',
        name: 'Kevin Anderson',
      },
    ],
    visible_to: 'Everyone',
    custom_fields: [
      {
        id: 1,
        name: 'My Field',
        value: '123456789',
        document_type: 'Contact',
        field_type: 'single_select',
      },
    ],
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    // Store the current timestamp to track new opportunities from this point forward
    await context.store?.put('_new_opportunity_last_created_at', new Date().toISOString());
  },
  async onDisable(context) {
    await context.store?.delete('_new_opportunity_last_created_at');
  },
  async run(context) {
    const { resource_type, include_closed, stage, manager } = context.propsValue;
    
    // Check for authentication
    if (!context.auth) {
      throw new Error('Authentication is required');
    }

    const accessToken = (context.auth as any).access_token;
    if (!accessToken) {
      throw new Error('Access token not found in authentication');
    }
    
    // Get the last check timestamp
    const lastCreatedAt = await context.store?.get('_new_opportunity_last_created_at');
    const currentTime = new Date().toISOString();
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (resource_type) {
        params.append('resource_type', resource_type);
      }
      
      if (include_closed) {
        params.append('include_closed', 'true');
      }
      
      // Use created order to get newest opportunities first
      params.append('order', 'created');
      
      // If we have a last check time, only get opportunities created since then
      if (lastCreatedAt && typeof lastCreatedAt === 'string') {
        params.append('updated_since', lastCreatedAt);
      }

      const queryString = params.toString();
      const url = `https://api.crmworkspace.com/v1/opportunities${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch opportunities: ${response.status} ${response.body}`);
      }

      const opportunities = response.body?.opportunities || [];
      
      // Filter opportunities by stage and manager if specified
      let filteredOpportunities = opportunities;
      
      if (stage) {
        filteredOpportunities = filteredOpportunities.filter((opp: any) => opp.stage === stage);
      }
      
      if (manager) {
        filteredOpportunities = filteredOpportunities.filter((opp: any) => opp.manager === manager);
      }
      
      // Filter for truly new opportunities (created since last check)
      const newOpportunities = lastCreatedAt && typeof lastCreatedAt === 'string'
        ? filteredOpportunities.filter((opportunity: any) => {
            const opportunityCreatedAt = new Date(opportunity.created_at);
            const lastCheck = new Date(lastCreatedAt);
            return opportunityCreatedAt > lastCheck;
          })
        : filteredOpportunities.slice(0, 10); // Limit initial fetch to prevent overwhelming

      // Update the last check timestamp
      await context.store?.put('_new_opportunity_last_created_at', currentTime);

      return newOpportunities;
    } catch (error) {
      console.error('Error fetching new opportunities:', error);
      throw error;
    }
  },
});