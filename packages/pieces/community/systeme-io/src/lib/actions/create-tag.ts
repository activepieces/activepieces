import { createAction, Property } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeOps } from '../common/operations';
import { createTagActionOutputSchema } from '../output-schemas';

export const createTag = createAction({
  auth: systemeIoAuth,
  name: 'create_tag',
  classification: 'WRITE',
  displayName: 'Create Tag',
  description: 'Create a tag, or return the existing tag with the same name',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the Systeme.io tag with the given name, creating it only if no tag has that name (matched case-insensitively). Use to get a tag id before tagging contacts, without creating duplicates. Idempotent when calls run one after another: a repeat returns the same tag with created=false. Two calls at the same moment can both find no tag and both create one. Names are at most 64 characters.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The tag name, up to 64 characters, e.g. "Webinar 2026 attendee".',
      required: true,
    }),
  },
  outputSchema: createTagActionOutputSchema,
  async run(context) {
    return systemeOps.getOrCreateTag({ apiKey: context.auth.secret_text, name: context.propsValue.name });
  },
});
