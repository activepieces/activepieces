import { createAction, Property } from '@activepieces/pieces-framework';
import { saveContent } from '../api';
import { cmsAuth } from '../auth';

export const saveToggleAction = createAction({
  name: 'save_toggle',
  auth: cmsAuth,
  displayName: 'Save Toggle',
  description: 'Save toggle content to Total CMS',
  props: {
    slug: Property.ShortText({
      displayName: 'CMS ID',
      description: 'The CMS ID of the content to save',
      required: true,
    }),
    status: Property.Checkbox({
      displayName: 'Status',
      description: 'The status of the toggle. "true" is on, "false" is off.',
      required: true,
    }),
  },
  async run(context) {
    const slug = context.propsValue.slug;
    const status = context.propsValue.status ? 'true' : 'false';
    return await saveContent(context.auth, 'toggle', slug, {
      nodecode: true,
      state: status,
    });
  },
});
