import { Property } from '@activepieces/pieces-framework';
import { googleChatAPIService } from './requests';

export const projectsDropdown = (refreshers: string[]) =>
  Property.Dropdown({
    displayName: 'Project',
    description: 'Select a Google Cloud Project',
    required: true,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Google account first',
          options: [],
        };
      }

      try {
        const projects = await googleChatAPIService.fetchProjects(
          auth.access_token
        );

        return {
          options: projects.map((project: any) => ({
            label: project.name,
            value: project.projectId,
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

export const spacesDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Space',
    description: `Select a Space${
      required ? '' : ', leave empty for all spaces'
    }`,
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Google account first',
          options: [],
        };
      }

      try {
        const spaces = await googleChatAPIService.fetchSpaces(
          auth.access_token
        );

        return {
          options: spaces.map((space: any) => ({
            label: space.displayName || space.name,
            value: space.name,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch spaces', e);
        return {
          options: [],
          placeholder: 'Unable to load spaces',
        };
      }
    },
  });

export const allSpacesDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Space',
    description: `Select a Space${
      required ? '' : ', leave empty for all spaces'
    }`,
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Google account first',
          options: [],
        };
      }

      try {
        const spaces = await googleChatAPIService.fetchAllSpaces(
          auth.access_token
        );

        return {
          options: spaces.map((space: any) => ({
            label: space.displayName || space.name,
            value: space.name,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch spaces', e);
        return {
          options: [],
          placeholder: 'Unable to load spaces',
        };
      }
    },
  });

export const directMessagesDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Direct Message',
    description: `Select a Direct Message${
      required ? '' : ', leave empty for all spaces'
    }`,
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Google account first',
          options: [],
        };
      }

      try {
        const spaces = await googleChatAPIService.fetchDirectMessages(
          auth.access_token
        );

        return {
          options: spaces.map((space: any) => ({
            label: space.displayName || space.name,
            value: space.name,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch spaces', e);
        return {
          options: [],
          placeholder: 'Unable to load spaces',
        };
      }
    },
  });

export const spacesMembersDropdown = (refreshers: string[]) =>
  Property.Dropdown({
    displayName: 'Space Member',
    description: 'Select a space member, leave empty for all members',
    required: false,
    refreshers,
    async options({ auth, spaceId }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Google account first',
          options: [],
        };
      }

      if (!spaceId) {
        return {
          disabled: true,
          placeholder: 'Please select a space first',
          options: [],
        };
      }

      try {
        const members = await googleChatAPIService.fetchSpaceMembers(
          auth.access_token,
          spaceId
        );

        return {
          options: members.map((member: any) => ({
            label: member.member.name,
            value: member.member.name,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch space members', e);
        return {
          options: [],
          placeholder: 'Unable to load space members',
        };
      }
    },
  });

export const peoplesDropdown = (refreshers: string[]) =>
  Property.Dropdown({
    displayName: 'Select A Person',
    description: 'Select a person',
    required: true,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Google account first',
          options: [],
        };
      }

      try {
        const members = await googleChatAPIService.fetchPeople(
          auth.access_token
        );

        return {
          options: members
            .map((member: any) => {
              const nameObj =
                member.names?.find((n: any) => n.metadata.primary) ||
                member.names?.[0];
              if (!nameObj) return null;

              return {
                label: nameObj.displayName,
                value: member.resourceName,
              };
            })
            .filter(Boolean),
        };
      } catch (e) {
        console.error('Failed to fetch people', e);
        return {
          options: [],
          placeholder: 'Unable to load people',
        };
      }
    },
  });

export const threadsDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Thread',
    description: `Select a thread to reply to${required ? '' : ', leave empty for new thread'}`,
    required,
    refreshers,
    async options({ auth, spaceId }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Google account first',
          options: [],
        };
      }

      if (!spaceId) {
        return {
          disabled: true,
          placeholder: 'Please select a space first',
          options: [],
        };
      }

      if (!spaceId.startsWith('spaces/')) {
        return {
          disabled: true,
          placeholder: 'Invalid space ID format. Please select a valid space.',
          options: [],
        };
      }

      try {
        const threads = await googleChatAPIService.fetchThreads(
          auth.access_token,
          spaceId
        );

        const options = threads.map((thread: any) => ({
          label: thread.displayName || thread.name,
          value: thread.name,
        }));

        options.unshift({
          label: 'Start new thread',
          value: '',
        });

        return { options };
      } catch (e) {
        console.error('Failed to fetch threads', e);
        return {
          options: [],
          placeholder: 'Unable to load threads',
        };
      }
    },
  });