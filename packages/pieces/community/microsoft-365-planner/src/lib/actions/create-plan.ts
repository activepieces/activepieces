import { createAction, Property } from '@activepieces/pieces-framework';
import { getGraphBaseUrl, getMicrosoftCloudFromAuth } from '../common/microsoft-cloud';
import { microsoft365PlannerAuth, microsoft365PlannerCommon } from '../common';
import { groupDropdown } from '../common/properties';

export const createPlan = createAction({
  auth: microsoft365PlannerAuth,
  name: 'createPlan',
  displayName: 'Create Plan',
  description: 'Create a new planner plan',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a new Microsoft 365 Planner plan with the given title, owned by a specified Microsoft 365 group. Use to set up a fresh planning board before adding buckets or tasks. The group must already exist; each call creates a separate plan, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    groupId: groupDropdown({ required: true }), 
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the plan',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const cloud = getMicrosoftCloudFromAuth(auth);
    const graphBaseUrl = getGraphBaseUrl(cloud);
    const planParams = {
      container: {
        url: `${graphBaseUrl}/v1.0/groups/${propsValue.groupId}`,
      },
      title: propsValue.title,
    };
    return await microsoft365PlannerCommon.createPlan({ auth, ...planParams });
  },
});
