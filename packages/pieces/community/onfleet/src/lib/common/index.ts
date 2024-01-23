import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';

import Onfleet from '@onfleet/node-onfleet';

export const common = {
  destination: Property.DynamicProperties({
    displayName: 'Destination',
    description: 'The task destination',
    required: true,
    refreshers: ['unparsedDestination'],
    props: async (propsValue) => {
      let fields: DynamicPropsValue = {};
      if (propsValue['unparsedDestination']) {
        fields = {
          unparsedAddress: Property.ShortText({
            displayName: 'Address',
            required: true,
          }),
        };
      } else {
        fields = {
          number: Property.ShortText({
            displayName: 'Number',
            required: true,
          }),
          street: Property.ShortText({
            displayName: 'Street Name',
            required: true,
          }),
          apartment: Property.ShortText({
            displayName: 'Apartment',
            required: true,
          }),
          city: Property.ShortText({
            displayName: 'City',
            required: true,
          }),
          country: Property.ShortText({
            displayName: 'Country',
            required: true,
          }),
          state: Property.ShortText({
            displayName: 'State',
            required: false,
          }),
          postalCode: Property.ShortText({
            displayName: 'Postal Code',
            required: false,
          }),
          name: Property.ShortText({
            displayName: 'Destination Name',
            required: false,
          }),
        };
      }

      return fields;
    },
  }),
  unparsedDestination: Property.Checkbox({
    displayName: 'Unparsed Destination',
    description:
      'Check this box if the destination is a single unparsed string',
    required: true,
    defaultValue: false,
  }),

  teams: Property.MultiSelectDropdown({
    displayName: 'Teams',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Enter API Key',
        };
      }
      const teams = await common.getTeams(auth as string);
      const options: any[] = teams.map((team: any) => {
        return {
          label: team.name,
          value: team.id,
        };
      });

      return {
        options: options,
        placeholder: 'Choose team',
      };
    },
  }),
  teamsRequired: Property.MultiSelectDropdown({
    displayName: 'Teams',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Enter API Key',
        };
      }
      const teams = await common.getTeams(auth as string);
      const options: any[] = teams.map((team: any) => {
        return {
          label: team.name,
          value: team.id,
        };
      });

      return {
        options: options,
        placeholder: 'Choose team',
      };
    },
  }),
  team: Property.Dropdown({
    displayName: 'Team',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Enter API Key',
        };
      }
      const teams = await common.getTeams(auth as string);
      const options: any[] = teams.map((team: any) => {
        return {
          label: team.name,
          value: team.id,
        };
      });

      return {
        options: options,
        placeholder: 'Choose team',
      };
    },
  }),

  hub: Property.Dropdown({
    displayName: 'Hub',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          options: [],
          placeholder: 'Enter API Key or use an expression',
        };
      }
      const hubs = await common.getHubs(auth as string);
      const options: any[] = hubs.map((hub: any) => {
        return {
          label: hub.name,
          value: hub.id,
        };
      });

      return {
        options: options,
        placeholder: 'Choose hub',
      };
    },
  }),
  hubOptional: Property.Dropdown({
    displayName: 'Hub',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          options: [],
          placeholder: 'Enter API Key or use an expression',
        };
      }
      const hubs = await common.getHubs(auth as string);
      const options: any[] = hubs.map((hub: any) => {
        return {
          label: hub.name,
          value: hub.id,
        };
      });

      return {
        options: options,
        placeholder: 'Choose hub',
      };
    },
  }),

  admin: Property.Dropdown({
    displayName: 'Administrator',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          options: [],
          placeholder: 'Enter API Key or use an expression',
        };
      }
      const admins = await common.getAdmins(auth as string);
      const options: any[] = admins.map((admin: any) => {
        return {
          label: admin.name,
          value: admin.id,
        };
      });

      return {
        options: options,
        placeholder: 'Choose admin',
      };
    },
  }),
  managers: Property.MultiSelectDropdown({
    displayName: 'Managers',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          options: [],
          placeholder: 'Enter API Key or use an expression',
        };
      }
      const admins = await common.getAdmins(auth as string);
      const options: any[] = admins.map((admin: any) => {
        return {
          label: admin.name,
          value: admin.id,
        };
      });

      return {
        options: options,
        placeholder: 'Choose managers',
      };
    },
  }),
  managersOptional: Property.MultiSelectDropdown({
    displayName: 'Managers',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          options: [],
          placeholder: 'Enter API Key or use an expression',
        };
      }
      const admins = await common.getAdmins(auth as string);
      const options: any[] = admins.map((admin: any) => {
        return {
          label: admin.name,
          value: admin.id,
        };
      });

      return {
        options: options,
        placeholder: 'Choose managers',
      };
    },
  }),

  worker: Property.Dropdown({
    displayName: 'Worker',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          options: [],
          placeholder: 'Enter API Key or use an expression',
        };
      }
      const workers = await common.getWorkers(auth as string);
      const options: any[] = workers.map((worker: any) => {
        return {
          label: worker.name,
          value: worker.id,
        };
      });

      return {
        options: options,
        placeholder: 'Choose worker',
      };
    },
  }),

  workers: Property.MultiSelectDropdown({
    displayName: 'Workers',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          options: [],
          placeholder: 'Enter API Key or use an expression',
        };
      }
      const workers = await common.getWorkers(auth as string);
      const options: any[] = workers.map((worker: any) => {
        return {
          label: worker.name,
          value: worker.id,
        };
      });

      return {
        options: options,
        placeholder: 'Choose workers',
      };
    },
  }),
  workersOptional: Property.MultiSelectDropdown({
    displayName: 'Workers',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          options: [],
          placeholder: 'Enter API Key or use an expression',
        };
      }
      const workers = await common.getWorkers(auth as string);
      const options: any[] = workers.map((worker: any) => {
        return {
          label: worker.name,
          value: worker.id,
        };
      });

      return {
        options: options,
        placeholder: 'Choose workers',
      };
    },
  }),

  async getTeams(apiKey: string) {
    const onfleetApi = new Onfleet(apiKey);

    return await onfleetApi.teams.get();
  },

  async getHubs(apiKey: string) {
    const onfleetApi = new Onfleet(apiKey);

    return await onfleetApi.hubs.get();
  },

  async getAdmins(apiKey: string) {
    const onfleetApi = new Onfleet(apiKey);

    return await onfleetApi.administrators.get();
  },

  async getWorkers(apiKey: string) {
    const onfleetApi = new Onfleet(apiKey);

    return await onfleetApi.workers.get();
  },

  async subscribeWebhook(apiKey: string, webhookUrl: string, triggerId: any) {
    const onfleetApi = new Onfleet(apiKey);

    return (
      await onfleetApi.webhooks.create({
        url: webhookUrl,
        trigger: triggerId,
      })
    ).id;
  },

  async unsubscribeWebhook(apiKey: string, webhookId: string) {
    const onfleetApi = new Onfleet(apiKey);

    return await onfleetApi.webhooks.deleteOne(webhookId);
  },
};

export enum OnfleetWebhookTriggers {
  TASK_STARTED = 0,
  TASK_ETA = 1,
  TASK_ARRIVAL = 2,
  TASK_COMPLETED = 3,
  TASK_FAILED = 4,
  WORKER_DUTY_CHANGE = 5,
  TASK_CREATED = 6,
  TASK_UPDATED = 7,
  TASK_DELETED = 8,
  TASK_ASSIGNED = 9,
  TASK_UNASSIGNED = 10,
  TASK_DELAYED = 12,
  TASK_CLONED = 13,
  SMS_RECIPIENT_MISSED = 14,
  WORKER_CREATED = 15,
  WORKER_DELETED = 16,
  SMS_RECIPIENT_OPT_OUT = 17,
  AUTO_DISPATCH_COMPLETED = 18,
}
