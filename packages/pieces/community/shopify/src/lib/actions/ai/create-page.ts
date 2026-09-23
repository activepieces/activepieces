import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlPage,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCreatePage = createAction({
  auth: shopifyAuth,
  name: 'create_page',
  classification: 'WRITE',
  displayName: 'Create Online Store Page',
  description: 'Create a content page on the online store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates an online store content page (for example an FAQ or About us page) and returns it with its id. Only the title is required; the body is HTML and the handle is generated from the title when left empty. The page is created hidden unless is_published is Yes, so nothing goes live by accident. publish_date alone does not publish or schedule the page; is_published must be Yes as well. Each call creates another page, so do not repeat it after a success. Needs the write_content access scope.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Page title, for example "Frequently asked questions".',
      required: true,
    }),
    body_html: Property.LongText({
      displayName: 'Body (HTML)',
      description: 'Page content, HTML allowed, for example "<h2>Shipping</h2><p>We ship worldwide.</p>".',
      required: false,
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'URL handle, for example "faq". Leave empty to generate it from the title.',
      required: false,
    }),
    is_published: shopifyProps.booleanChoice({
      displayName: 'Published',
      description: 'Yes publishes the page on the storefront. Leave empty or No to keep it hidden.',
    }),
    publish_date: Property.DateTime({
      displayName: 'Publish Date',
      description: 'Publication date and time, ISO 8601, for example "2026-10-01T09:00:00Z". It does not publish or schedule the page on its own; Published must be Yes as well.',
      required: false,
    }),
    template_suffix: Property.ShortText({
      displayName: 'Template Suffix',
      description: 'Theme template suffix, for example "contact" for page.contact.json. Leave empty for the default template.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const title = shopifyValues.nonEmpty(propsValue.title);
    if (!title) {
      throw new Error('A page title is required. Nothing was created.');
    }
    const page = shopifyValues.compact({
      title,
      body: shopifyValues.nonEmpty(propsValue.body_html),
      handle: shopifyValues.nonEmpty(propsValue.handle),
      isPublished: shopifyValues.toBooleanChoice(propsValue.is_published) ?? false,
      publishDate: shopifyValues.nonEmpty(propsValue.publish_date),
      templateSuffix: shopifyValues.nonEmpty(propsValue.template_suffix),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      pageCreate: { page: GqlPage | null } | null;
    }>({
      auth,
      query: `mutation CreatePage($page: PageCreateInput!) { pageCreate(page: $page) { page { ${shopifyFields.PAGE_FIELDS} } userErrors { field message code } } }`,
      variables: { page },
    });
    const created = data.pageCreate?.page;
    if (!created) {
      throw new Error('Shopify did not return the created page.');
    }
    return {
      ...shopifyMappers.mapPage(created),
      redacted_fields: redactedFields,
    };
  },
});
