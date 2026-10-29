import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const createUserAction = createAction({
  auth: discourseAuth,
  name: 'create_user',
  classification: 'WRITE',
  displayName: 'Create User',
  description: 'Creates a Discourse user account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a Discourse user account with name, email, username and an initial password. Needs an admin key. Unless Active is on, Discourse sends an activation email to the address, so only use real addresses the person expects mail at. Usernames and emails are unique, so a retry fails with "already taken" instead of duplicating.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    email: Property.ShortText({ displayName: 'Email', required: true }),
    username: Property.ShortText({ displayName: 'Username', required: true }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Initial password (Discourse rejects new accounts without one). At least the forum minimum length, usually 10 characters.',
      required: true,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'On to activate the account immediately with no activation email.',
      required: false,
      defaultValue: false,
    }),
    approved: Property.Checkbox({
      displayName: 'Approved',
      description: 'On to approve the account when the forum requires approval.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: discourseSchemas.createdUser,
  async run({ auth, propsValue }) {
    const email = discourseInput.text({ value: propsValue.email, label: 'Email' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Email must be a valid email address.');
    }
    const password = discourseInput.secret({ value: propsValue.password, label: 'Password' });
    const username = discourseInput.text({ value: propsValue.username, label: 'Username' });
    const body = discourseMap.rec(
      await discourseRequest({
        auth: auth.props,
        method: HttpMethod.POST,
        path: '/users.json',
        body: {
          name: discourseInput.text({ value: propsValue.name, label: 'Name' }),
          email,
          username,
          password,
          active: propsValue.active === true,
          approved: propsValue.approved === true,
        },
      }),
    );
    if (body['success'] === false) {
      const errors = discourseMap.rec(body['errors']);
      const details = Object.entries(errors)
        .map(([field, value]) => `${field}: ${discourseMap.list(value).map(String).join(', ')}`)
        .join('; ');
      throw new Error(`Discourse did not create the user: ${discourseMap.str(body['message']) ?? ''} ${details}`.trim());
    }
    let userId = discourseMap.num(body['user_id']);
    if (userId === null && body['success'] === true) {
      const profile = discourseMap.rec(
        await discourseRequest({
          auth: auth.props,
          method: HttpMethod.GET,
          path: `/u/${discourseInput.name({ value: username, label: 'Username' })}.json`,
        }),
      );
      userId = discourseMap.num(discourseMap.rec(profile['user'])['id']);
    }
    return {
      success: body['success'] === true,
      active: discourseMap.bool(body['active']),
      user_id: userId,
      message: discourseMap.str(body['message']),
    };
  },
});
