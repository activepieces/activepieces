import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { capsuleCommon } from './index';

export const capsuleProps = {
  contactType: Property.StaticDropdown({
    displayName: 'Contact Type',
    description: 'Type of contact to create',
    required: true,
    options: {
      options: [
        { label: 'Person', value: 'person' },
        { label: 'Organisation', value: 'organisation' },
      ],
    },
  }),

  contactId: Property.Dropdown({
    displayName: 'Contact',
    description: 'Select a contact',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please authenticate first',
          options: [],
        };
      }

      try {
        const response = await capsuleCommon.getParties(auth as OAuth2PropertyValue);
        const parties = response.parties || [];
        
        return {
          options: parties.map((party: any) => ({
            label: party.name || `${party.firstName} ${party.lastName}`,
            value: party.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load contacts',
          options: [],
        };
      }
    },
  }),

  opportunityId: Property.Dropdown({
    displayName: 'Opportunity',
    description: 'Select an opportunity',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please authenticate first',
          options: [],
        };
      }

      try {
        const response = await capsuleCommon.getOpportunities(auth as OAuth2PropertyValue);
        const opportunities = response.opportunities || [];
        
        return {
          options: opportunities.map((opp: any) => ({
            label: opp.name,
            value: opp.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load opportunities',
          options: [],
        };
      }
    },
  }),

  projectId: Property.Dropdown({
    displayName: 'Project',
    description: 'Select a project',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please authenticate first',
          options: [],
        };
      }

      try {
        const response = await capsuleCommon.getProjects(auth as OAuth2PropertyValue);
        const projects = response.projects || [];
        
        return {
          options: projects.map((project: any) => ({
            label: project.name,
            value: project.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load projects',
          options: [],
        };
      }
    },
  }),
};
