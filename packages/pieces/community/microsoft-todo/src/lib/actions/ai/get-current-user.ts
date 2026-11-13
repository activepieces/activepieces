import { createAction } from '@activepieces/pieces-framework';
import { User } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { microsoftTodoGetCurrentUserOutputSchema } from '../../output-schemas';

export const microsoftTodoGetCurrentUserAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_get_current_user',
  outputSchema: microsoftTodoGetCurrentUserOutputSchema,
  displayName: 'Get Current User',
  description: 'Get the profile of the connected Microsoft account.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Return the profile (ID, name, email, user principal name) of the Microsoft account this connection uses, so you can confirm whose tasks you are working with. Takes no input. Read-only.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const client = createTodoClient(context.auth);
    const user: User = await client
      .api('/me')
      .select('id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,preferredLanguage')
      .get();
    return {
      id: user.id ?? null,
      displayName: user.displayName ?? null,
      givenName: user.givenName ?? null,
      surname: user.surname ?? null,
      mail: user.mail ?? null,
      userPrincipalName: user.userPrincipalName ?? null,
      jobTitle: user.jobTitle ?? null,
      preferredLanguage: user.preferredLanguage ?? null,
    };
  },
});
