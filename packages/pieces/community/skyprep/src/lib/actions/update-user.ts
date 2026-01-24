import { createAction, Property } from '@activepieces/pieces-framework';
import { skyprepAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateUser = createAction({
  auth: skyprepAuth,
  name: 'updateUser',
  displayName: 'Update User',
  description:
    'Update user information. Omitted parameters will not be updated.',
  props: {
    user_email: Property.ShortText({
      displayName: 'User Email',
      description: 'The email address of the user to update (required)',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the user',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the user',
      required: false,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'The role of the user',
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'User ID', value: 'user_id' },
        ],
      },
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title/position of the user',
      required: false,
    }),
    cell: Property.ShortText({
      displayName: 'Cell Phone',
      description: 'The cell phone number of the user',
      required: false,
    }),
    work_phone: Property.ShortText({
      displayName: 'Work Phone',
      description: 'The work phone number of the user',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      description: 'The address of the user',
      required: false,
    }),
    card_no: Property.ShortText({
      displayName: 'Card/ID Number',
      description: 'The unique user identifier (e.g. student #, badge #)',
      required: false,
    }),
    email_notifications: Property.Checkbox({
      displayName: 'Email Notifications',
      description: 'Whether the user receives email notifications',
      required: false,
    }),
    sms_notifications: Property.Checkbox({
      displayName: 'SMS Notifications',
      description:
        'Whether the user receives SMS notifications (requires Twilio integration)',
      required: false,
    }),
    access_start_date: Property.ShortText({
      displayName: 'Access Start Date',
      description:
        'The date when the user can start accessing content (e.g., "July 31, 2015")',
      required: false,
    }),
    access_end_date: Property.ShortText({
      displayName: 'Access End Date',
      description:
        'The date when the user can no longer access content (e.g., "July 30, 2017")',
      required: false,
    }),
    password_expiration_date: Property.ShortText({
      displayName: 'Password Expiration Date',
      description:
        'The date when the user password expires (e.g., "July 19, 2022")',
      required: false,
    }),
  },
  async run(context) {
    const {
      user_email,
      first_name,
      last_name,
      role,
      title,
      cell,
      work_phone,
      address,
      card_no,
      email_notifications,
      sms_notifications,
      access_start_date,
      access_end_date,
      password_expiration_date,
    } = context.propsValue;

    const body: any = {
      user_email,
    };

    // Add optional fields only if provided
    if (first_name) body.first_name = first_name;
    if (last_name) body.last_name = last_name;
    if (role) body.role = role;
    if (title) body.title = title;
    if (cell) body.cell = cell;
    if (work_phone) body.work_phone = work_phone;
    if (address) body.address = address;
    if (card_no) body.card_no = card_no;
    if (email_notifications !== undefined)
      body.email_notifications = email_notifications;
    if (sms_notifications !== undefined)
      body.sms_notifications = sms_notifications;
    if (access_start_date) body.access_start_date = access_start_date;
    if (access_end_date) body.access_end_date = access_end_date;
    if (password_expiration_date)
      body.password_expiration_date = password_expiration_date;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/update_user',
      body
    );

    return response;
  },
});
