import { Property } from '@activepieces/pieces-framework';
import { CapsuleCrmAuthType } from './auth';
import { capsuleCrmClient } from './client';

export const capsuleCrmProps = {
  contact_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Contact',
      description: 'The contact (Person or Organisation) to select.',
      required: required,
      refreshers: [],
      options: async (props) => {
        const { auth } = props;
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }

        const searchTerm = (props['searchValue'] as string) ?? '';

        const contacts = await capsuleCrmClient.searchContacts(
          auth as CapsuleCrmAuthType,
          searchTerm
        );

        const options = contacts.map((contact) => {
          const label =
            contact.type === 'person'
              ? `${contact.firstName} ${contact.lastName}`
              : contact.name;
          return {
            label: label || 'Unnamed Contact',
            value: contact.id,
          };
        });

        return {
          disabled: false,
          options: options,
        };
      },
    }),

  milestone_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Milestone',
      description: 'The milestone to assign the opportunity to.',
      required: required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        const milestones = await capsuleCrmClient.listMilestones(
          auth as CapsuleCrmAuthType
        );
        const options = milestones.map((milestone) => {
          return {
            label: milestone.name,
            value: milestone.id,
          };
        });
        return {
          disabled: false,
          options: options,
        };
      },
    }),

  opportunity_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Opportunity',
      description: 'The opportunity to associate with this item.',
      required: required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        const opportunities = await capsuleCrmClient.listOpportunities(
          auth as CapsuleCrmAuthType
        );
        return {
          disabled: false,
          options: opportunities.map((opportunity) => ({
            label: opportunity.name,
            value: opportunity.id,
          })),
        };
      },
    }),

  project_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Project',
      description: 'The project to associate this item with.',
      required: required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        const projects = await capsuleCrmClient.listProjects(
          auth as CapsuleCrmAuthType
        );
        return {
          disabled: false,
          options: projects.map((project) => ({
            label: project.name,
            value: project.id,
          })),
        };
      },
    }),

  case_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Case',
      description: 'The case to associate this item with.',
      required: required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        const cases = await capsuleCrmClient.listCases(
          auth as CapsuleCrmAuthType
        );
        return {
          disabled: false,
          options: cases.map((kase) => ({ label: kase.name, value: kase.id })),
        };
      },
    }),

  owner_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Owner',
      description: 'The user to assign the task to.',
      required: required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        const users = await capsuleCrmClient.listUsers(
          auth as CapsuleCrmAuthType
        );
        return {
          disabled: false,
          options: users.map((user) => ({
            label: user.username,
            value: user.id,
          })),
        };
      },
    }),

  team_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Team',
      description: 'The team to assign the contact to.',
      required: required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        const teams = await capsuleCrmClient.listTeams(
          auth as CapsuleCrmAuthType
        );
        return {
          disabled: false,
          options: teams.map((team) => ({
            label: team.name,
            value: team.id,
          })),
        };
      },
    }),
};
