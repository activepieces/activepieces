import { createAction, Property } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../..';
import { mailgunCommon, mailgunApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addMailingListMember = createAction({
  auth: mailgunAuth,
  name: 'add_mailing_list_member',
  displayName: 'Add Mailing List Member',
  description: 'Add a new member to a Mailgun mailing list',
  props: {
    list: mailgunCommon.mailingListDropdown,
    address: Property.ShortText({
      displayName: 'Member Email Address',
      description: 'The email address to add to the mailing list.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Member Name',
      description: 'The name of the member.',
      required: false,
    }),
    upsert: Property.Checkbox({
      displayName: 'Update If Exists',
      description:
        'If enabled, updates the member if they already exist. Otherwise, an error is returned for duplicates.',
      required: true,
      defaultValue: true,
    }),
    subscribed: Property.Checkbox({
      displayName: 'Subscribed',
      description: 'Set the subscription status of the member.',
      required: false,
      defaultValue: true,
    }),
    vars: Property.Json({
      displayName: 'Custom Variables',
      description:
        'JSON object with custom variables to store with this member, e.g. {"age": 30, "city": "Paris"}.',
      required: false,
    }),
  },
  async run(context) {
    const { list, address, name, upsert, subscribed, vars } =
      context.propsValue;
    const auth = context.auth;

    const bodyFields: Record<string, string> = {
      address,
      upsert: upsert ? 'yes' : 'no',
      subscribed: subscribed === false ? 'no' : 'yes',
    };
    if (name) bodyFields['name'] = name;
    if (vars) bodyFields['vars'] = JSON.stringify(vars);

    const response = await mailgunApiCall<{
      member: {
        address: string;
        name: string;
        subscribed: boolean;
        vars: Record<string, unknown>;
      };
      message: string;
    }>({
      apiKey: auth.props.api_key,
      region: auth.props.region,
      method: HttpMethod.POST,
      path: `/v3/lists/${list}/members`,
      body: new URLSearchParams(bodyFields).toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const member = response.body.member;
    return {
      message: response.body.message,
      member_address: member.address,
      member_name: member.name,
      member_subscribed: member.subscribed,
      member_vars: member.vars ? JSON.stringify(member.vars) : null,
    };
  },
});
