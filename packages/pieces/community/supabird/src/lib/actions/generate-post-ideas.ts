import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { supabirdAuth } from '../auth';
import { resolveJobResponse, supabirdRequest } from '../common/client';
import { socialSetDropdown } from '../common/props';

const IDEAS_JOB_TIMEOUT_MS = 120_000;

export type GenerateIdeasInput = {
  ideaSource?: string;
  writingStyle: string;
  creatorList?: DynamicPropsValue;
  numberOfPosts?: number;
  instructions?: string;
  socialSet?: string;
};

export function buildIdeasBody(
  input: GenerateIdeasInput
): Record<string, unknown> {
  const ideaSource = input.ideaSource ?? 'user';
  const body: Record<string, unknown> = {
    writing_style: input.writingStyle,
    idea_source: ideaSource,
  };

  if (input.writingStyle === 'creators' || ideaSource === 'creator') {
    const creators = ((input.creatorList?.['creators'] as unknown[]) ?? [])
      .map((name) => String(name ?? '').trim().replace(/^@/, ''))
      .filter((name) => name.length > 0);
    if (creators.length === 0) {
      throw new Error('Add at least one creator X username.');
    }
    if (creators.length > 10) {
      throw new Error('You can add up to 10 creators.');
    }
    body['creators'] = creators;
  }

  if (input.numberOfPosts !== undefined && input.numberOfPosts !== null) {
    if (input.numberOfPosts < 5 || input.numberOfPosts > 20) {
      throw new Error('Number of ideas must be between 5 and 20.');
    }
    body['number_of_posts'] = Math.floor(input.numberOfPosts);
  }

  const instructions = input.instructions?.trim();
  if (instructions) {
    body['instructions'] = instructions;
  }
  if (input.socialSet) {
    body['social_set'] = input.socialSet;
  }
  return body;
}

export const generatePostIdeasAction = createAction({
  auth: supabirdAuth,
  name: 'generate_post_ideas',
  classification: 'WRITE',
  displayName: 'Generate Post Ideas',
  description:
    'Generate post ideas in your own style or in the style of chosen creators. SupaBird also saves them as saved ideas.',
  audience: 'both',
  aiMetadata: {
    description:
      "Generate 5 to 20 post ideas with SupaBird, in the account owner's style or in the style of up to 10 named X creators, then wait for the background job and return the ideas. Spends SupaBird credits and saves the ideas to the account on every call, so retries duplicate.",
    idempotent: false,
  },
  props: {
    ideaSource: Property.StaticDropdown({
      displayName: 'Ideas based on',
      description: 'Where SupaBird should take the ideas from.',
      required: true,
      defaultValue: 'user',
      options: {
        options: [
          { label: 'My own posts', value: 'user' },
          { label: 'Posts from chosen creators', value: 'creator' },
        ],
      },
    }),
    writingStyle: Property.StaticDropdown({
      displayName: 'Writing style',
      description: 'Whose voice the ideas should be written in.',
      required: true,
      defaultValue: 'myStyle',
      options: {
        options: [
          { label: 'My style', value: 'myStyle' },
          { label: "Other creators' style", value: 'creators' },
        ],
      },
    }),
    creatorList: Property.DynamicProperties({
      auth: supabirdAuth,
      displayName: 'Creators',
      required: false,
      refreshers: ['ideaSource', 'writingStyle'],
      props: async ({ ideaSource, writingStyle }): Promise<DynamicPropsValue> => {
        if (writingStyle === 'creators' || ideaSource === 'creator') {
          return {
            creators: Property.Array({
              displayName: 'Creator X usernames',
              description:
                'Up to 10 X usernames, for example paulg or naval. Write them without the @.',
              required: true,
            }),
          };
        }
        return {};
      },
    }),
    numberOfPosts: Property.Number({
      displayName: 'Number of ideas',
      description: 'How many ideas to generate, from 5 to 20.',
      required: false,
      defaultValue: 10,
    }),
    instructions: Property.LongText({
      displayName: 'Instructions',
      description:
        'Optional guidance such as topics, tone or length, for example "Ideas about building in public, short and direct".',
      required: false,
    }),
    socialSet: socialSetDropdown,
  },
  async run(context) {
    const token = context.auth.secret_text;
    const body = buildIdeasBody(context.propsValue);
    const response = await supabirdRequest({
      token,
      method: HttpMethod.POST,
      path: '/ideas',
      body,
    });
    const job = await resolveJobResponse<{
      id?: string;
      type?: string;
      status?: string;
      created_at?: string | null;
      posts?: { id: string; content: string }[];
    }>({
      token,
      response,
      timeoutMs: IDEAS_JOB_TIMEOUT_MS,
    });
    const ideas = job.posts ?? [];
    return {
      job_id: job.id ?? null,
      status: job.status ?? 'completed',
      idea_count: ideas.length,
      ideas,
    };
  },
});
