import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCommon } from './client';

export const partyDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Party',
    description: 'Select a party (person or organization)',
    required,
    refreshers,
    async options({ auth, entityType }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Capsule CRM account first',
          options: [],
        };
      }

      // Only show options if party is selected as entity type
      if (entityType !== 'party') {
        return {
          disabled: true,
          placeholder: 'Select "Party (Contact)" in "Associate With" field first',
          options: [],
        };
      }

      try {
        const response = await capsuleCommon.apiCall({
          auth,
          method: HttpMethod.GET,
          resourceUri: '/parties',
          queryParams: { perPage: '100' }
        });

        const parties = response.body.parties || [];

        return {
          options: parties.map((party: any) => ({
            label: party.type === 'person' ? `${party.firstName} ${party.lastName}` : party.name,
            value: party.id.toString(),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch parties', e);
        return {
          options: [],
          placeholder: 'Unable to load parties',
        };
      }
    },
  });

export const milestoneDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Milestone',
    description: 'Select a milestone/stage',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Capsule CRM account first',
          options: [],
        };
      }

      try {
        const response = await capsuleCommon.apiCall({
          auth,
          method: HttpMethod.GET,
          resourceUri: '/milestones',
          queryParams: { perPage: '100' }
        });

        const milestones = response.body.milestones || [];

        return {
          options: milestones.map((milestone: any) => ({
            label: milestone.name,
            value: milestone.id.toString(),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch milestones', e);
        return {
          options: [],
          placeholder: 'Unable to load milestones',
        };
      }
    },
  });

export const projectDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Project',
    description: 'Select a project',
    required,
    refreshers,
    async options({ auth, entityType }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Capsule CRM account first',
          options: [],
        };
      }

      // Only show options if project is selected as entity type
      if (entityType !== 'project') {
        return {
          disabled: true,
          placeholder: 'Select "Project" in "Associate With" field first',
          options: [],
        };
      }

      try {
        const response = await capsuleCommon.apiCall({
          auth,
          method: HttpMethod.GET,
          resourceUri: '/kases',
          queryParams: { perPage: '100' }
        });

        const projects = response.body.kases || [];

        return {
          options: projects.map((project: any) => ({
            label: project.name,
            value: project.id.toString(),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch projects', e);
        return {
          options: [],
          placeholder: 'Unable to load projects',
        };
      }
    },
  });

export const opportunityDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Opportunity',
    description: 'Select an opportunity',
    required,
    refreshers,
    async options({ auth, entityType }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Capsule CRM account first',
          options: [],
        };
      }

      // Only show options if opportunity is selected as entity type
      if (entityType !== 'opportunity') {
        return {
          disabled: true,
          placeholder: 'Select "Opportunity" in "Associate With" field first',
          options: [],
        };
      }

      try {
        const response = await capsuleCommon.apiCall({
          auth,
          method: HttpMethod.GET,
          resourceUri: '/opportunities',
          queryParams: { perPage: '100' }
        });

        const opportunities = response.body.opportunities || [];

        return {
          options: opportunities.map((opportunity: any) => ({
            label: opportunity.name,
            value: opportunity.id.toString(),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch opportunities', e);
        return {
          options: [],
          placeholder: 'Unable to load opportunities',
        };
      }
    },
  });

export const taskCategoryDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Task Category',
    description: 'Select a task category',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Capsule CRM account first',
          options: [],
        };
      }

      try {
        const response = await capsuleCommon.apiCall({
          auth,
          method: HttpMethod.GET,
          resourceUri: '/task/categories',
        });

        const categories = response.body.categories || [];

        return {
          options: categories.map((category: any) => ({
            label: category.name,
            value: category.id.toString(),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch task categories', e);
        return {
          options: [],
          placeholder: 'Unable to load task categories',
        };
      }
    },
  });
