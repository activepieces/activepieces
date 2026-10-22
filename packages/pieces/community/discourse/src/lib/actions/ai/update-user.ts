import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const updateUserAction = createAction({
  auth: discourseAuth,
  name: 'update_user',
  classification: 'WRITE',
  displayName: 'Update User',
  description: 'Updates the profile fields of a Discourse user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Update profile fields (name, title, bio, location, website) of a Discourse user by username. Omitted fields stay unchanged; tick Clear Fields to blank a field. Needs an admin key or the user own key. Sets absolute values, so safe to retry.',
    idempotent: true,
  },
  props: {
    username: Property.ShortText({ displayName: 'Username', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    bio_raw: Property.LongText({ displayName: 'Bio', description: 'Markdown.', required: false }),
    location: Property.ShortText({ displayName: 'Location', required: false }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    clear_fields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: 'Fields to set to empty.',
      required: false,
      options: {
        disabled: false,
        options: ['name', 'title', 'bio_raw', 'location', 'website'].map((value) => ({ label: value, value })),
      },
    }),
  },
  outputSchema: discourseSchemas.userUpdate,
  async run({ auth, propsValue }) {
    const username = discourseInput.name({ value: propsValue.username, label: 'Username' });
    const values: Record<string, unknown> = {
      name: propsValue.name,
      title: propsValue.title,
      bio_raw: propsValue.bio_raw,
      location: propsValue.location,
      website: propsValue.website,
    };
    const clear = (propsValue.clear_fields ?? []).filter((field) => FIELDS.includes(field));
    const body = Object.fromEntries([
      ...FIELDS.flatMap((field) => {
        const text = discourseInput.optionalText(values[field]);
        return text === undefined ? [] : [[field, text]];
      }),
      ...clear.map((field) => [field, '']),
    ]);
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one field to update or clear.');
    }
    const response = discourseMap.rec(
      await discourseRequest({ auth: auth.props, method: HttpMethod.PUT, path: `/u/${username}.json`, body }),
    );
    return {
      ...discourseMap.user({ raw: response['user'], baseUrl: discourseOps.baseUrl(auth.props) }),
      success: response['success'] === 'OK' || response['success'] === true,
    };
  },
});

const FIELDS = ['name', 'title', 'bio_raw', 'location', 'website'];
