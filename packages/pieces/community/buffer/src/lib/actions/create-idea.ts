import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../common/auth';
import { bufferClient } from '../common/client';
import { bufferProps } from '../common/props';

type CreateIdeaResponse = {
  createIdea: {
    __typename?: string;
    message?: string;
    idea?: {
      id: string;
      organizationId: string;
      groupId?: string;
      createdAt?: number;
      updatedAt?: number;
      content?: {
        title?: string;
        text?: string;
        media?: Array<{ url: string; type: string; alt?: string }>;
        tags?: Array<{ id: string; name: string; color?: string }>;
      };
    };
    refreshIdeas?: boolean;
  };
};

const CREATE_IDEA_MUTATION = `
  mutation CreateIdea($input: CreateIdeaInput!) {
    createIdea(input: $input) {
      __typename
      ... on IdeaResponse {
        idea {
          id
          organizationId
          groupId
          createdAt
          updatedAt
          content {
            title
            text
            media { url type alt }
            tags { id name color }
          }
        }
        refreshIdeas
      }
      ... on MutationError {
        message
      }
    }
  }
`;

export const createIdea = createAction({
  auth: bufferAuth,
  name: 'create_idea',
  displayName: 'Create Idea',
  description: "Save a new idea to your Buffer Idea Bank.",
  audience: 'both',
  aiMetadata: {
    description:
      'Saves a new draft idea (title, body text, and/or attached images) to a Buffer organization\'s Idea Bank for later use. Choose it to stash content concepts without scheduling them to a channel. The idea must include at least a title, text, or one image. Not idempotent — each call creates a new idea.',
    idempotent: false,
  },
  props: {
    organizationId: bufferProps.organizationId(),
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
  async run(context) {
    const { organizationId, title, text, imageUrls, aiAssisted } =
      context.propsValue;

    if (!title && !text && (!imageUrls || imageUrls.length === 0)) {
      throw new Error(
        'An idea must include at least a title, text, or one image.',
      );
    }

    const media = (imageUrls ?? []).map((url) => ({
      url: url as string,
      type: 'image',
    }));

    const content: Record<string, unknown> = {};
    if (title) content['title'] = title;
    if (text) content['text'] = text;
    if (media.length > 0) content['media'] = media;
    if (aiAssisted) content['aiAssisted'] = true;

    const data = await bufferClient.graphql<CreateIdeaResponse>({
      accessToken: context.auth.secret_text,
      query: CREATE_IDEA_MUTATION,
      variables: { input: { organizationId, content } },
    });

    if (data.createIdea.message) {
      throw new Error(
        `Buffer rejected the idea: ${data.createIdea.message}`,
      );
    }
    return data;
  },
});
