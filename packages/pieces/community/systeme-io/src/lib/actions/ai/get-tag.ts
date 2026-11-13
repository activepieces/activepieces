import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../../common/auth';
import { systemeIoCommon, systemeIoInput } from '../../common/client';
import { tagRow } from '../../common/mappers';
import { aiTagOutputSchema } from '../../output-schemas-ai';

export const systemeGetTag = createAction({
  auth: systemeIoAuth,
  name: 'systeme_get_tag',
  classification: 'READ',
  displayName: 'Get Tag',
  description: 'Get a tag by id',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieves one Systeme.io tag (id, name, created date) by its numeric id. Use to confirm a tag id still exists or read its name; use systeme_list_tags to find a tag by name. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    tag_id: Property.ShortText({
      displayName: 'Tag ID',
      description: 'Numeric tag id, e.g. "123456" (from systeme_list_tags).',
      required: true,
    }),
  },
  outputSchema: aiTagOutputSchema,
  async run(context) {
    const id = systemeIoInput.requireId({ value: context.propsValue.tag_id, name: 'tag_id' });
    const tag = await systemeIoCommon.apiCall<unknown>({ method: HttpMethod.GET, url: `/tags/${id}`, auth: context.auth.secret_text });
    return tagRow(tag);
  },
});
