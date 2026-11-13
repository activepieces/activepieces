import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseUpdateUserOutputSchema } from '../../output-schemas';

export const updateUserAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_user',
  outputSchema: metabaseUpdateUserOutputSchema,
  displayName: 'Update User',
  description: "Update a user's name, email, locale or admin status.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a user. Updating other users or admin status needs an admin key. Use Add Group Member / Remove Group Member for groups.',
    idempotent: true,
  },
  props: {
    userId: metabaseAiProps.userId({ required: true }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'New first name. Empty = unchanged.',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'New last name. Empty = unchanged.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'New email. Empty = unchanged.',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'Language code such as en or de. Empty = unchanged.',
      required: false,
    }),
    isSuperuser: metabaseAiProps.yesNo({
      displayName: 'Admin',
      description:
        'Yes makes the user an admin, No removes admin. Empty = unchanged.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateUser({
      auth,
      userId: propsValue.userId,
      body: {
        first_name: propsValue.firstName,
        last_name: propsValue.lastName,
        email: propsValue.email,
        locale: propsValue.locale,
        is_superuser: propsValue.isSuperuser,
      },
    });
  },
});
