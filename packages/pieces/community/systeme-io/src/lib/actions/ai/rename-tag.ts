import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../../common/auth';
import { systemeIoCommon, systemeIoInput } from '../../common/client';
import { tagRow } from '../../common/mappers';
import { systemeOps } from '../../common/operations';
import { aiTagOutputSchema } from '../../output-schemas-ai';

export const systemeRenameTag = createAction({
  auth: systemeIoAuth,
  name: 'systeme_rename_tag',
  classification: 'WRITE',
  displayName: 'Rename Tag',
  description: 'Change the name of a tag',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames an existing Systeme.io tag; the tag keeps its id and stays on every contact that has it. Use when a tag should be relabelled rather than replaced. Names are at most 64 characters. Idempotent: renaming to the same name again changes nothing.',
    idempotent: true,
  },
  props: {
    tag_id: Property.ShortText({
      displayName: 'Tag ID',
      description: 'Numeric tag id, e.g. "123456" (from systeme_list_tags).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'The new tag name, up to 64 characters.',
      required: true,
    }),
  },
  outputSchema: aiTagOutputSchema,
  async run(context) {
    const id = systemeIoInput.requireId({ value: context.propsValue.tag_id, name: 'tag_id' });
    const name = systemeOps.validTagName(context.propsValue.name);
    const tag = await systemeIoCommon.apiCall<unknown>({
      method: HttpMethod.PUT,
      url: `/tags/${id}`,
      auth: context.auth.secret_text,
      body: { name },
    });
    return tagRow(tag);
  },
});
