import { tarventAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient, tarventCommon } from '../common';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const createAudienceGroup = createAction({
  auth: tarventAuth,
  name: 'tarvent_create_audience_group',
  displayName: 'Create An Audience Group',
  description: 'Creates an audience group in the selected audience.',
  props: {
    audienceId: tarventCommon.audienceId(true, 'Audience to create the group in.'),
    name: tarventCommon.name('Group name', true, 'Enter the group name. (100 character limit)'),
    description: tarventCommon.name('Group description', false, 'Use the description to describe what the group is for. NOTE: If the group is public this description will show up in forms that have the groups question.'),
    isPublic: Property.StaticDropdown({
      displayName: 'Public group',
      description: 'Select whether the group is public or not. Public groups are shown in forms with the groups question.',
      required: true,
      options: {
        options: [
          {
            label: 'True',

            value: 'true',
          },
          {
            label: 'False',
            value: 'false',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { audienceId, name, description, isPublic } = context.propsValue;

    await propsValidation.validateZod(context.propsValue, {
      name: z.string().min(1).max(100, 'Name has to be less than 100 characters.'),
      description: z.string().min(1).max(255, 'Description has to be less than 255 characters.'),
    });

    const client = makeClient(context.auth);
    return await client.createAudienceGroup(audienceId, name, description, isPublic);
  },
});
