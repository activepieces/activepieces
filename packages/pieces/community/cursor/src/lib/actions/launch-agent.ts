import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cursorAuth } from '../common/auth';
import { makeCursorRequest } from '../common/client';

interface ImageItem {
  image: ApFile;
  width: number;
  height: number;
}

export const launchAgent = createAction({
  auth: cursorAuth,
  name: 'launch_agent',
  displayName: 'Launch Agent',
  description: 'Start a new cloud agent to work on your repository',
  props: {
    promptText: Property.LongText({
      displayName: 'Task Prompt',
      description: 'The instruction text for the agent',
      required: true,
    }),
    images: Property.Array({
      displayName: 'Images',
      description: 'Optional images to include with the prompt (max 5)',
      required: false,
      properties: {
        image: Property.File({
          displayName: 'Image',
          description: 'Image file',
          required: true,
        }),
        width: Property.Number({
          displayName: 'Width',
          description: 'Image width in pixels',
          required: true,
        }),
        height: Property.Number({
          displayName: 'Height',
          description: 'Image height in pixels',
          required: true,
        }),
      },
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'The LLM to use (e.g., claude-4-sonnet). Leave empty to use the default model.',
      required: false,
    }),
    repository: Property.ShortText({
      displayName: 'Repository URL',
      description: 'GitHub repository URL (e.g., https://github.com/your-org/your-repo)',
      required: true,
    }),
    ref: Property.ShortText({
      displayName: 'Base Branch/Ref',
      description: 'Git ref (branch name, tag, or commit hash) to use as the base branch',
      required: false,
    }),
    autoCreatePr: Property.Checkbox({
      displayName: 'Auto Create Pull Request',
      description: 'Automatically create a pull request when the agent completes',
      required: false,
      defaultValue: false,
    }),
    openAsCursorGithubApp: Property.Checkbox({
      displayName: 'Open as Cursor GitHub App',
      description: 'Open the pull request as the Cursor GitHub App instead of as the user. Only applies if auto-create PR is enabled.',
      required: false,
      defaultValue: false,
    }),
    skipReviewerRequest: Property.Checkbox({
      displayName: 'Skip Reviewer Request',
      description: 'Skip adding the user as a reviewer to the pull request. Only applies if auto-create PR is enabled and opened as Cursor GitHub App.',
      required: false,
      defaultValue: false,
    }),
    branchName: Property.ShortText({
      displayName: 'Custom Branch Name',
      description: 'Custom branch name for the agent to create',
      required: false,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'URL to receive webhook notifications about agent status changes',
      required: false,
    }),
    webhookSecret: Property.ShortText({
      displayName: 'Webhook Secret',
      description: 'Secret key for webhook payload verification (minimum 32 characters)',
      required: false,
    }),
  },
  async run(context) {
    const {
      promptText,
      images,
      model,
      repository,
      ref,
      autoCreatePr,
      openAsCursorGithubApp,
      skipReviewerRequest,
      branchName,
      webhookUrl,
      webhookSecret,
    } = context.propsValue;

    const imageItems = (images as ImageItem[]) ?? [];

    if (imageItems.length > 5) {
      throw new Error('Maximum 5 images allowed');
    }

    const prompt: any = {
      text: promptText,
    };

    if (imageItems.length > 0) {
      prompt.images = imageItems.map((item) => ({
        data: item.image.base64,
        dimension: {
          width: item.width,
          height: item.height,
        },
      }));
    }

    const source: any = {
      repository,
    };

    if (ref) {
      source.ref = ref;
    }

    const body: any = {
      prompt,
      source,
    };

    if (model) {
      body.model = model;
    }

    const target: any = {};
    let hasTarget = false;

    if (autoCreatePr !== undefined) {
      target.autoCreatePr = autoCreatePr;
      hasTarget = true;
    }

    if (openAsCursorGithubApp !== undefined) {
      target.openAsCursorGithubApp = openAsCursorGithubApp;
      hasTarget = true;
    }

    if (skipReviewerRequest !== undefined) {
      target.skipReviewerRequest = skipReviewerRequest;
      hasTarget = true;
    }

    if (branchName) {
      target.branchName = branchName;
      hasTarget = true;
    }

    if (hasTarget) {
      body.target = target;
    }

    if (webhookUrl) {
      const webhook: any = {
        url: webhookUrl,
      };

      if (webhookSecret) {
        if (webhookSecret.length < 32) {
          throw new Error('Webhook secret must be at least 32 characters long');
        }
        webhook.secret = webhookSecret;
      }

      body.webhook = webhook;
    }

    return await makeCursorRequest(
      context.auth,
      '/v0/agents',
      HttpMethod.POST,
      body
    );
  },
});

