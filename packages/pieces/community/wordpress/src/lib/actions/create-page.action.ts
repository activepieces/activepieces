import { createAction, Property } from '@activepieces/pieces-framework';
import { wordpressCommon } from '../common';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { createPageActionOutputSchema } from '../output-schemas';

export const createWordPressPage = createAction({
  auth: wordpressAuth,
  name: 'create_page',
  classification: 'WRITE',
  description: 'Add a new page to your WordPress site',
  audience: 'both',
  aiMetadata: { description: 'Publishes a new static page (not a blog post) on a WordPress site via the REST API, with optional status, slug, excerpt, and comment settings. Choose this for standalone pages like About or Contact rather than dated posts. Requires a title and HTML content; not idempotent — each call creates a separate page.', idempotent: false },
  displayName: 'Create Page',
  outputSchema: createPageActionOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    content: Property.LongText({
      description: 'Body of the page. HTML is allowed.',
      displayName: 'Content',
      required: true,
    }),
    status: Property.StaticDropdown({
      description: 'Publish now, schedule it, or save as a draft.',
      displayName: 'Status',
      required: false,
      options: {
        disabled: false,
        options: [
          { value: 'publish', label: 'Published' },
          { value: 'future', label: 'Scheduled' },
          { value: 'draft', label: 'Draft' },
          { value: 'pending', label: 'Pending' },
          { value: 'private', label: 'Private' },
        ],
      },
    }),
    date: Property.ShortText({
      description: "Publish date and time in the site's timezone.",
      displayName: 'Publish Date',
      placeholder: '2026-09-21T09:00:00',
      required: false,
    }),
    slug: Property.ShortText({
      advanced: true,
      description: 'Last part of the URL.',
      displayName: 'Slug',
      placeholder: 'my-first-post',
      required: false,
    }),
    excerpt: Property.LongText({
      advanced: true,
      description: 'Short summary shown in listings. HTML is allowed.',
      displayName: 'Excerpt',
      required: false,
    }),
    comment_status: Property.Checkbox({
      advanced: true,
      description: 'On lets readers comment. Off leaves the setting as is.',
      displayName: 'Allow Comments',
      required: false,
    }),
    ping_status: Property.Checkbox({
      advanced: true,
      description: 'On accepts pingbacks and trackbacks. Off leaves it as is.',
      displayName: 'Allow Pingbacks',
      required: false,
    }),
  },
  async run(context) {
    if (!(await wordpressCommon.urlExists(context.auth.props.website_url.trim()))) {
      throw new Error('Website url is invalid: ' + context.auth.props.website_url);
    }
    const requestBody: Record<string, unknown> = {};
    if (context.propsValue.date) {
      requestBody['date'] = context.propsValue.date;
    }
    if (context.propsValue.comment_status) {
      requestBody['comment_status'] = context.propsValue.comment_status
        ? 'open'
        : 'closed';
    }
    if (context.propsValue.ping_status) {
      requestBody['ping_status'] = context.propsValue.ping_status
        ? 'open'
        : 'closed';
    }
    if (context.propsValue.slug) {
      requestBody['slug'] = context.propsValue.slug;
    }
    if (context.propsValue.excerpt) {
      requestBody['excerpt'] = context.propsValue.excerpt;
    }
    if (context.propsValue.status) {
      requestBody['status'] = context.propsValue.status;
    }
    requestBody['content'] = context.propsValue.content;
    requestBody['title'] = context.propsValue.title;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${context.auth.props.website_url.trim()}/wp-json/wp/v2/pages`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: context.auth.props.username,
        password: context.auth.props.password,
      },
      body: requestBody,
    };
    const response = await httpClient.sendRequest<
      { id: string; name: string }[]
    >(request);
    return response;
  },
});
