import { createAction } from '@activepieces/pieces-framework';
import { firstTouchAuth } from '../auth';
import { linkedinUtils } from '../common/linkedin';
import { firstTouchProps } from '../common/props';

export const viewProfileAction = createAction({
  auth: firstTouchAuth,
  name: 'view_profile',
  classification: 'WRITE',
  displayName: 'View Profile',
  description: "Visit a contact's LinkedIn profile from a teammate's account.",
  audience: 'both',
  aiMetadata: {
    description:
      "Queues a LinkedIn profile visit to one person from a teammate's account, a light first touch that shows up in their 'who viewed your profile'. Paced by FirstTouch and, by default, waits for human approval in FirstTouch Tasks. Each call creates a new visit task, so retries can duplicate.",
    idempotent: false,
  },
  props: {
    ...linkedinUtils.contactProps(),
    sender: firstTouchProps.teammateDropdown({
      displayName: 'Send From',
      description: 'The teammate whose LinkedIn account visits. Leave empty for the owner of the API key.',
    }),
    ...linkedinUtils.optionalContextProps(),
  },
  async run(context) {
    return linkedinUtils.startContactSequence({
      apiKey: context.auth.secret_text,
      actionType: 'linkedin_profile_view',
      label: 'View Profile',
      props: context.propsValue,
      extra: {},
    });
  },
});
