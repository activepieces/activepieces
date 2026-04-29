import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { featuresVoteApiCall } from '../common';
import { featuresVoteAuth } from '../auth';

export const createReleaseAction = createAction({
  auth: featuresVoteAuth,
  name: 'create_release',
  displayName: 'Create Release',
  description: 'Create a new release on your changelog. Optionally link features.',
  props: {
    version: Property.ShortText({
      displayName: 'Version',
      description: 'The version number (e.g. "1.2.0").',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The release title (e.g. "January Release").',
      required: true,
    }),
    short_description: Property.ShortText({
      displayName: 'Short Description',
      description: 'A brief summary of the release.',
      required: false,
    }),
    long_description: Property.LongText({
      displayName: 'Long Description',
      description: 'Full release notes in Markdown format.',
      required: false,
    }),
    feature_ids: Property.Array({
      displayName: 'Feature IDs',
      description: 'IDs of features to link to this release.',
      required: false,
    }),
    is_draft: Property.Checkbox({
      displayName: 'Draft',
      description: 'Set to true to hide from public changelog.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      version: context.propsValue.version,
      title: context.propsValue.title,
      is_draft: context.propsValue.is_draft ?? false,
    };
    if (context.propsValue.short_description) {
      body['short_description'] = context.propsValue.short_description;
    }
    if (context.propsValue.long_description) {
      body['long_description'] = context.propsValue.long_description;
    }
    if (context.propsValue.feature_ids && context.propsValue.feature_ids.length > 0) {
      body['feature_ids'] = context.propsValue.feature_ids;
    }
    const response = await featuresVoteApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/releases',
      body,
    });
    return response.body;
  },
});