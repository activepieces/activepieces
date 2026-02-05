import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { timeOpsAuth } from '../..';
import { BASE_URL, timeOpsClient } from '../common';

export const createRegistration = createAction({
  auth: timeOpsAuth,
  name: 'create_registration',
  displayName: 'Create Registration',
  description: 'Creates a registration.',
  props: {
    userId: Property.Dropdown({
      displayName: 'User',
      description: 'The user for this registration.',
      auth: timeOpsAuth,
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account.',
            options: [],
          };
        }

        const response = await httpClient.sendRequest<
          { id: number; name: string }[]
        >({
          method: HttpMethod.GET,
          url: `${BASE_URL}/Users`,
          headers: {
            'x-api-key': (auth as { secret_text: string }).secret_text,
          },
        });

        return {
          disabled: false,
          options: response.body.map((user) => ({
            label: user.name ?? `User ${user.id}`,
            value: user.id,
          })),
        };
      },
    }),
    startedAt: Property.DateTime({
      displayName: 'Started At',
      description: 'The start date and time of the registration.',
      required: true,
    }),
    stoppedAt: Property.DateTime({
      displayName: 'Stopped At',
      description: 'The end date and time of the registration.',
      required: false,
    }),
    projectId: Property.Dropdown({
      displayName: 'Project',
      description: 'The project to associate with this registration.',
      auth: timeOpsAuth,
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account.',
            options: [],
          };
        }

        const response = await httpClient.sendRequest<
          { id: number; name: string }[]
        >({
          method: HttpMethod.GET,
          url: `${BASE_URL}/Projects`,
          headers: {
            'x-api-key': (auth as { secret_text: string }).secret_text,
          },
        });

        return {
          disabled: false,
          options: response.body.map((project) => ({
            label: project.name ?? `Project ${project.id}`,
            value: project.id,
          })),
        };
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the registration.',
      required: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether this registration is billable.',
      required: false,
      defaultValue: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tag IDs to associate with this registration.',
      required: false,
    }),
  },
  async run(context) {
    const { userId, startedAt, stoppedAt, projectId, description, billable, tags } = context.propsValue;

    const tagIds = tags?.map((tag) => parseInt(tag as string, 10)).filter((id) => !isNaN(id)) ?? null;

    return await timeOpsClient.makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/Registrations',
      {
        userId,
        startedAt,
        stoppedAt: stoppedAt ?? null,
        projectId: projectId ?? null,
        description: description ?? null,
        billable: billable ?? false,
        tags: tagIds,
      }
    );
  },
});
