import { createAction, Property } from '@activepieces/pieces-framework';
import { addGreet, addProfile } from '../api';
import { bonjoroAuth, BonjoroAuthType } from '../auth';
import {
  buildCampaignDropdown,
  buildTemplateDropdown,
  buildUserDropdown,
} from '../props';

export const addGreetAction = createAction({
  name: 'add_greet',
  auth: bonjoroAuth,
  displayName: 'Create a Greet',
  description: 'Create a new Greet in Bonjoro',
  props: {
    note: Property.LongText({
      displayName: 'Note',
      description: 'Note to send with the greet',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email to send the greet to',
      required: true,
    }),
    first: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the person to greet',
      required: false,
    }),
    last: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the person to greet',
      required: false,
    }),
    assignee: Property.Dropdown({
      displayName: 'Assignee',
      description: 'Who to assign the greet to',
      required: false,
      refreshers: [],
      options: async ({ auth }) =>
        await buildUserDropdown(auth as BonjoroAuthType),
    }),
    campaign: Property.Dropdown({
      displayName: 'Campaign',
      description: 'The campaign to add the greet to',
      required: false,
      refreshers: [],
      options: async ({ auth }) =>
        await buildCampaignDropdown(auth as BonjoroAuthType),
    }),
    template: Property.Dropdown({
      displayName: 'Template',
      description: 'The template to use for the greet',
      required: false,
      refreshers: [],
      options: async ({ auth }) =>
        await buildTemplateDropdown(auth as BonjoroAuthType),
    }),
    custom: Property.Json({
      displayName: 'Custom Attributes',
      description: 'Enter custom attributes to send with the greet',
      required: false,
      defaultValue: {},
    }),
  },
  async run(context) {
    const user = {
      email: context.propsValue.email,
      first_name: context.propsValue.first,
      last_name: context.propsValue.last,
    };
    addProfile(context.auth, user);

    const greet = {
      profiles: [context.propsValue.email],
      note: context.propsValue.note,
      assignee_id: context.propsValue.assignee,
      campaign_id: context.propsValue.campaign,
      template_id: context.propsValue.template,
      custom_attributes: context.propsValue.custom,
    };

    if (!greet.assignee_id) delete greet.assignee_id;
    if (!greet.campaign_id) delete greet.campaign_id;
    if (!greet.template_id) delete greet.template_id;
    if (!greet.custom_attributes) delete greet.custom_attributes;

    return await addGreet(context.auth, greet);
  },
});
