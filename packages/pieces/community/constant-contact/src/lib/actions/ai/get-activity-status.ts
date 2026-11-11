import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccContacts } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { activityOutputSchema } from '../../common/output-schemas';

export const getActivityStatusAiAction = createAction({
  auth: constantContactAuth,
  name: 'get_activity_status_ai',
  classification: 'READ',
  displayName: 'Get Activity Status',
  description: 'Gets the state of a background contact activity.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets the state (processing, completed, failed, ...) and errors of a Constant Contact background activity by activity_id, for list or tag changes still processing.',
    idempotent: true,
  },
  outputSchema: activityOutputSchema,
  props: {
    activity_id: aiProps.text({ displayName: 'Activity ID', description: 'The activity_id returned by a list or tag action.', required: true }),
  },
  async run({ auth, propsValue }) {
    const [activityId] = ccInput.idList({ value: propsValue.activity_id, label: 'Activity ID', max: 1, required: true });
    return ccContacts.getActivity({ accessToken: auth.access_token, activityId });
  },
});
