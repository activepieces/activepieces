import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedhiveAuth } from '../common/auth';
import { feedhiveCommon } from '../common';

export const fireWorkflowTriggerAction = createAction({
  auth: feedhiveAuth,
  name: 'fire_workflow_trigger',
  displayName: 'Create Post via Trigger',
  description: 'Fires a FeedHive Workflow Trigger to create a post. The workflow defines which accounts to post to, the AI model to use, and any default content.',
  props: {
    setup_instructions: Property.MarkDown({
      value: `### How to find your Trigger ID

1. In FeedHive, open the **Workflows** section in the sidebar.
2. Open the workflow you want to fire.
3. In the workflow settings, copy the **Trigger ID** (a short alphanumeric code).

**Note:** You can also pass custom template variables — if your workflow content contains placeholders like \`[[first_name]]\`, add them in the **Template Variables** field below.`,
    }),
    trigger_id: Property.ShortText({
      displayName: 'Trigger ID',
      description: 'The ID of your FeedHive workflow trigger. Found in FeedHive → Workflows → your workflow settings.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Post Text',
      description: 'The content of the post. Leave empty to let your workflow generate or use a template.',
      required: false,
    }),
    prompt: Property.LongText({
      displayName: 'AI Prompt',
      description: 'Ask FeedHive AI to generate the post content. Only used if your workflow is configured for AI generation.',
      required: false,
    }),
    scheduled: Property.DateTime({
      displayName: 'Scheduled Date & Time',
      description: 'When to publish the post. Leave empty to use the schedule defined in the workflow.',
      required: false,
    }),
    media_urls: Property.Array({
      displayName: 'Media URLs',
      description: 'Public URLs of images or videos to include in the post (e.g. https://example.com/photo.jpg).',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Post title — only applicable for YouTube, Google My Business, and Pinterest posts.',
      required: false,
    }),
    link: Property.ShortText({
      displayName: 'Link URL',
      description: 'A URL to attach to the post — only applicable for YouTube, Google My Business, and Pinterest posts.',
      required: false,
    }),
    template_variables: Property.Object({
      displayName: 'Template Variables',
      description: 'If your workflow template uses placeholders like [[first_name]], provide them here as key-value pairs (e.g. first_name → John). Each key maps directly to a [[placeholder]] in your template.',
      required: false,
    }),
  },
  async run(context) {
    const { trigger_id, text, prompt, scheduled, media_urls, title, link, template_variables } =
      context.propsValue;

    // Template variables are applied first so explicit fields always take precedence
    const body: Record<string, unknown> = { ...(template_variables ?? {}) };
    if (text) body['text'] = text;
    if (prompt) body['prompt'] = prompt;
    if (scheduled) body['scheduled'] = scheduled;
    if (media_urls && (media_urls as string[]).length > 0) body['media_urls'] = media_urls;
    if (title) body['title'] = title;
    if (link) body['link'] = link;

    const response = await feedhiveCommon.apiCall<{ success: boolean }>({
      token: context.auth as unknown as string,
      method: HttpMethod.POST,
      path: `/triggers/${trigger_id}`,
      body,
    });

    return { success: response.body.success ?? true };
  },
});
