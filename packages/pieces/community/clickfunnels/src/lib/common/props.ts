import { Property } from '@activepieces/pieces-framework';
import { clickfunnelsApiService } from './requests';
import { clickfunnelsAuth } from './constants';

export const teamsDropdown = (refreshers: string[]) =>
  Property.Dropdown({
    displayName: 'Team',
    description: 'Select the team',
    required: true,
    refreshers,
    auth: clickfunnelsAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your ClickFunnels account first',
        };
      }

      try {
        const response = await clickfunnelsApiService.fetchTeams(auth.props);

        return {
          options: response.map((team: any) => ({
            label: team.name,
            value: team.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder:
            'Failed to load teams. Please check your authentication.',
        };
      }
    },
  });

export const coursesDropdown = (refreshers: string[]) =>
  Property.Dropdown({
    auth: clickfunnelsAuth,
    displayName: 'Course',
    description: 'Select a course',
    required: true,
    refreshers,
    options: async ({ auth, workspaceId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your ClickFunnels account first',
        };
      }

      if (!workspaceId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a workspace first',
        };
      }

      try {
        const courses = await clickfunnelsApiService.fetchCourses(
          auth.props,
          workspaceId as string
        );

        return {
          options: courses.map((course: any) => ({
            label: course.title,
            value: course.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder:
            'Failed to load teams. Please check your authentication.',
        };
      }
    },
  });

export const teamMembershipsDropdown = (
  refreshers: string[],
  required = true
) =>
  Property.Dropdown({
    auth: clickfunnelsAuth,
    displayName: 'Assignee',
    description: 'Select an assignee on your team',
    required,
    refreshers,
    options: async ({ auth, teamId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your ClickFunnels account first',
        };
      }

      if (!teamId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a team first',
        };
      }

      try {
        const response = await clickfunnelsApiService.fetchTeam(auth.props, teamId as string);

        return {
          options: [
            { label: 'Leave Unassigned', value: null },
            ...response.memberships,
          ].map((membership) => {
            if (membership.label) {
              return {
                label: membership.label,
                value: membership.value,
              };
            }

            return {
              label: `${membership.user.first_name} ${membership.user.last_name}`,
              value: membership.id,
            };
          }),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder:
            'Failed to load team members. Please check your authentication.',
        };
      }
    },
  });

export const workspacesDropdown = (refreshers: string[]) =>
  Property.Dropdown({
    auth: clickfunnelsAuth,
    displayName: 'Workspace',
    description: 'Select the workspace',
    required: true,
    refreshers,
    options: async ({ auth, teamId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your ClickFunnels account first',
        };
      }

      if (!teamId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a team first',
        };
      }

      try {
        const workspaces = await clickfunnelsApiService.fetchWorkspaces(
          auth.props,
          teamId as string
        );

        return {
          options: workspaces.map((workspace: any) => ({
            label: workspace.name,
            value: workspace.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder:
            'Failed to load workspaces. Please check your authentication.',
        };
      }
    },
  });

export const pipelinesDropdown = (refreshers: string[]) =>
  Property.Dropdown({
    auth: clickfunnelsAuth,
    displayName: 'Pipeline',
    description: 'Select a pipeline',
    required: true,
    refreshers,
    options: async ({ auth, workspaceId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your ClickFunnels account first',
        };
      }

      if (!workspaceId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a workspace first',
        };
      }

      try {
        const pipelines = await clickfunnelsApiService.fetchPipelines(
          auth.props,
          workspaceId as string
        );

        return {
          options: pipelines.map((pipeline: any) => ({
            label: pipeline.name,
            value: pipeline.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder:
            'Failed to load pipelines. Please check your authentication.',
        };
      }
    },
  });

export const pipelineStagesDropdown = (refreshers: string[]) =>
  Property.Dropdown({
    auth: clickfunnelsAuth,
    displayName: 'Pipeline Stage',
    description: 'Select a pipeline stage.',
    required: true,
    refreshers,
    options: async ({ auth, pipelineId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your ClickFunnels account first',
        };
      }

      if (!pipelineId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a pipeline first',
        };
      }

      try {
        const pipelineStages = await clickfunnelsApiService.fetchPipelineStages(
          auth.props,
          pipelineId as string
        );

        return {
          options: pipelineStages.map((pipelineStage: any) => ({
            label: pipelineStage.name,
            value: pipelineStage.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder:
            'Failed to load pipeline stages. Please check your authentication.',
        };
      }
    },
  });

export const contactsDropdown = (refreshers: string[]) =>
  Property.Dropdown({
    auth: clickfunnelsAuth,
    displayName: 'Contact',
    description: 'Select a contact',
    required: true,
    refreshers,
    options: async ({ auth, workspaceId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your ClickFunnels account first',
        };
      }

      if (!workspaceId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a workspace first',
        };
      }

      try {
        const contacts = await clickfunnelsApiService.fetchContacts(
          auth.props,
          workspaceId as string
        );

        return {
          options: contacts.map((contact: any) => ({
            label: (() => {
              const firstName = contact.first_name || '';
              const lastName = contact.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim();
              return (
                fullName ||
                contact.email_address ||
                contact.phone_number ||
                'Unknown Contact'
              );
            })(),
            value: contact.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder:
            'Failed to load contacts. Please check your authentication.',
        };
      }
    },
  });

export const tagsDropdown = (refreshers: string[]) =>
  Property.Dropdown({
    auth: clickfunnelsAuth,
    displayName: 'Tag',
    description: 'Select a tag to apply',
    required: true,
    refreshers,
    options: async ({ auth, workspaceId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your ClickFunnels account first',
        };
      }

      if (!workspaceId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a workspace first',
        };
      }

      try {
        const tags = await clickfunnelsApiService.fetchTags(auth.props, workspaceId as string);

        return {
          options: tags.map((tag: any) => ({
            label: tag.name,
            value: tag.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load tags. Please check your authentication.',
        };
      }
    },
  });
export const multiTagsDropdown = (refreshers: string[]) =>
  Property.MultiSelectDropdown({
    auth: clickfunnelsAuth,
    displayName: 'Tag',
    description: 'Select tags to apply',
    required: false,
    refreshers,
    options: async ({ auth, workspaceId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your ClickFunnels account first',
        };
      }

      if (!workspaceId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a workspace first',
        };
      }

      try {
        const tags = await clickfunnelsApiService.fetchTags(auth.props, workspaceId as string);

        return {
          options: tags.map((tag: any) => ({
            label: tag.name,
            value: tag.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load tags. Please check your authentication.',
        };
      }
    },
  });

export const appliedTagsDropdown = (refreshers: string[]) =>
  Property.Dropdown({
    auth: clickfunnelsAuth,
    displayName: 'Tag',
    description: 'Select a tag',
    required: true,
    refreshers,
      options: async ({ auth, contactId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your ClickFunnels account first',
        };
      }

      if (!contactId) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a contact first',
        };
      }

      try {
        const tags = await clickfunnelsApiService.fetchAppliedTags(
          auth.props,
          contactId as string
        );

        return {
          options: tags.map((tag: any) => ({
            label: tag.tag.name,
            value: tag.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load tags. Please check your authentication.',
        };
      }
    },
  });
