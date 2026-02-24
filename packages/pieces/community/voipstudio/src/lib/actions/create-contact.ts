import { createAction, Property } from '@activepieces/pieces-framework';
import { voipstudioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
  auth: voipstudioAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Creates a new Contact resource',
  props: {
    type: Property.ShortText({
      displayName: 'Type',
      description: 'Contact type',
      required: false,
    }),
    dialler_source_id: Property.Number({
      displayName: 'Dialler Source ID',
      description: 'Dialler source ID',
      required: false,
    }),
    outcome_id: Property.Number({
      displayName: 'Outcome ID',
      description: 'Outcome ID',
      required: false,
    }),
    group_name: Property.ShortText({
      displayName: 'Group Name',
      description: 'Group name',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Contact first name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Contact last name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Contact email address',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Company name',
      required: false,
    }),
    tel: Property.ShortText({
      displayName: 'Telephone',
      description: 'Primary telephone number',
      required: false,
    }),
    tel_1: Property.ShortText({
      displayName: 'Telephone 1',
      description: 'Secondary telephone number',
      required: false,
    }),
    tel_2: Property.ShortText({
      displayName: 'Telephone 2',
      description: 'Tertiary telephone number',
      required: false,
    }),
    speed_dial_phone: Property.ShortText({
      displayName: 'Speed Dial Phone',
      description: 'Primary speed dial phone number',
      required: false,
    }),
    speed_dial_phone_1: Property.ShortText({
      displayName: 'Speed Dial Phone 1',
      description: 'Secondary speed dial phone number',
      required: false,
    }),
    speed_dial_phone_2: Property.ShortText({
      displayName: 'Speed Dial Phone 2',
      description: 'Tertiary speed dial phone number',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      description: 'Primary mobile number',
      required: false,
    }),
    mobile_1: Property.ShortText({
      displayName: 'Mobile 1',
      description: 'Secondary mobile number',
      required: false,
    }),
    mobile_2: Property.ShortText({
      displayName: 'Mobile 2',
      description: 'Tertiary mobile number',
      required: false,
    }),
    speed_dial_mobile: Property.ShortText({
      displayName: 'Speed Dial Mobile',
      description: 'Primary speed dial mobile number',
      required: false,
    }),
    speed_dial_mobile_1: Property.ShortText({
      displayName: 'Speed Dial Mobile 1',
      description: 'Secondary speed dial mobile number',
      required: false,
    }),
    speed_dial_mobile_2: Property.ShortText({
      displayName: 'Speed Dial Mobile 2',
      description: 'Tertiary speed dial mobile number',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Contact notes',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'Contact labels',
      required: false,
    }),
    groups: Property.Array({
      displayName: 'Groups',
      description: 'Contact groups',
      required: false,
    }),
    transfer_list: Property.Checkbox({
      displayName: 'Transfer List',
      description: 'Whether to add to transfer list',
      required: false,
    }),
    user_id: Property.Number({
      displayName: 'User ID',
      description: 'User ID',
      required: false,
    }),
  },
  async run(context) {
    const {
      type,
      dialler_source_id,
      outcome_id,
      group_name,
      first_name,
      last_name,
      email,
      company,
      tel,
      tel_1,
      tel_2,
      speed_dial_phone,
      speed_dial_phone_1,
      speed_dial_phone_2,
      mobile,
      mobile_1,
      mobile_2,
      speed_dial_mobile,
      speed_dial_mobile_1,
      speed_dial_mobile_2,
      notes,
      labels,
      groups,
      transfer_list,
      user_id,
    } = context.propsValue;

    const body: any = {};

    if (type !== undefined) body.type = type;
    if (dialler_source_id !== undefined)
      body.dialler_source_id = dialler_source_id;
    if (outcome_id !== undefined) body.outcome_id = outcome_id;
    if (group_name !== undefined) body.group_name = group_name;
    if (first_name !== undefined) body.first_name = first_name;
    if (last_name !== undefined) body.last_name = last_name;
    if (email !== undefined) body.email = email;
    if (company !== undefined) body.company = company;
    if (tel !== undefined) body.tel = tel;
    if (tel_1 !== undefined) body.tel_1 = tel_1;
    if (tel_2 !== undefined) body.tel_2 = tel_2;
    if (speed_dial_phone !== undefined)
      body.speed_dial_phone = speed_dial_phone;
    if (speed_dial_phone_1 !== undefined)
      body.speed_dial_phone_1 = speed_dial_phone_1;
    if (speed_dial_phone_2 !== undefined)
      body.speed_dial_phone_2 = speed_dial_phone_2;
    if (mobile !== undefined) body.mobile = mobile;
    if (mobile_1 !== undefined) body.mobile_1 = mobile_1;
    if (mobile_2 !== undefined) body.mobile_2 = mobile_2;
    if (speed_dial_mobile !== undefined)
      body.speed_dial_mobile = speed_dial_mobile;
    if (speed_dial_mobile_1 !== undefined)
      body.speed_dial_mobile_1 = speed_dial_mobile_1;
    if (speed_dial_mobile_2 !== undefined)
      body.speed_dial_mobile_2 = speed_dial_mobile_2;
    if (notes !== undefined) body.notes = notes;
    if (labels !== undefined) body.labels = labels;
    if (groups !== undefined) body.groups = groups;
    if (transfer_list !== undefined) body.transfer_list = transfer_list;
    if (user_id !== undefined) body.user_id = user_id;

    return await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/contacts',
      body
    );
  },
});
