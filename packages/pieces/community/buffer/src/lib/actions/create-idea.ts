import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../common/auth';
import { bufferClient } from '../common/client';
import { bufferProps } from '../common/props';
import { bufferQueries } from '../common/queries';
import { bufferAiProps } from '../common/ai-props';
import { createIdeaOutputSchema } from '../common/output-schemas';

export const createIdea = createAction({
  auth: bufferAuth,
  name: 'create_idea',
  classification: 'WRITE',
  displayName: 'Create Idea',
  description: "Save a new idea to your Buffer Idea Bank.",
  audience: 'both',
  aiMetadata: {
    description:
      'Saves a new idea (title, text and/or image URLs) to a Buffer organization\'s Ideas board for later; it does not schedule or publish anything (use Create a Post for that). Organization ID comes from List Organizations; Idea Group is an optional board column ID from List Idea Groups. At least a title, text or one image is required. Ideas cannot be edited or deleted through the API, and each call creates a new idea.',
    idempotent: false,
  },
  props: {
    organizationId: bufferProps.organizationId(),
    groupId: bufferProps.ideaGroupId(),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'A short title or headline for the idea.',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The main body of the idea.',
      required: false,
    }),
    imageUrls: Property.Array({
      displayName: 'Image URLs',
      description: 'Public URLs of images to attach to the idea.',
      required: false,
    }),
    aiAssisted: Property.Checkbox({
      displayName: 'AI Assisted',
      description: 'Mark this idea as created with AI assistance.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: createIdeaOutputSchema,
  async run(context) {
    const { organizationId, groupId, title, text, imageUrls, aiAssisted } =
      context.propsValue;
    const images = bufferAiProps.cleanList(imageUrls);

    if (!title && !text && images.length === 0) {
      throw new Error(
        'An idea must include at least a title, text, or one image.',
      );
    }

    const media = images.map((url) => ({
      url,
      type: 'image',
    }));

    const content: Record<string, unknown> = {};
    if (title) content['title'] = title;
    if (text) content['text'] = text;
    if (media.length > 0) content['media'] = media;
    if (aiAssisted) content['aiAssisted'] = true;

    const group = bufferAiProps.optionalId(groupId);
    const data = await bufferClient.graphql<CreateIdeaResponse>({
      accessToken: context.auth.secret_text,
      query: bufferQueries.CREATE_IDEA,
      variables: {
        input: {
          organizationId,
          content,
          ...(group === undefined ? {} : { group: { groupId: group } }),
        },
      },
      operation: 'create the idea',
    });

    const result = data.createIdea;
    if (result.message) {
      throw new Error(`Buffer rejected the idea: ${result.message}`);
    }
    if (result.__typename === 'Idea') {
      const { id, organizationId, groupId, createdAt, updatedAt, content } =
        result;
      return {
        createIdea: {
          __typename: 'IdeaResponse',
          idea: { id, organizationId, groupId, createdAt, updatedAt, content },
          refreshIdeas: false,
        },
      };
    }
    return data;
  },
});

type CreatedIdea = {
  id?: string;
  organizationId?: string;
  groupId?: string | null;
  createdAt?: number;
  updatedAt?: number;
  content?: {
    title?: string | null;
    text?: string | null;
    media?: Array<{ url: string; type: string; alt?: string | null }> | null;
    tags?: Array<{ id: string; name: string; color?: string }> | null;
  };
};

type CreateIdeaResponse = {
  createIdea: CreatedIdea & {
    __typename?: string;
    message?: string;
    idea?: CreatedIdea;
    refreshIdeas?: boolean;
  };
};
