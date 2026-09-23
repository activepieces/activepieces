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

export const shopifyAiUpdatePage = createAction({
  auth: shopifyAuth,
  name: 'update_page',
  classification: 'WRITE',
  displayName: 'Update Online Store Page',
  description: 'Change a content page\'s title, body, handle, template or publish state.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one online store content page and returns it. Only the fields you supply are sent; at least one is required. A new body replaces the whole body. is_published Yes makes the page visible on the storefront and No hides it. Repeating the same update leaves the same state. Needs the write_content access scope.',
    idempotent: true,
  },
  props: {
    page_id: Property.ShortText({
      displayName: 'Page ID',
      description: 'The page id, numeric or "gid://shopify/Page/…". Find it with list_pages.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title.',
      required: false,
    }),
    body_html: Property.LongText({
      displayName: 'Body (HTML)',
      description: 'New page content, HTML allowed. Replaces the whole body.',
      required: false,
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'New URL handle, for example "shipping-faq".',
      required: false,
    }),
    redirect_new_handle: shopifyProps.booleanChoice({
      displayName: 'Redirect Old Handle',
      description: 'When changing the handle, create a redirect from the old URL. Leave empty for the Shopify default.',
    }),
    is_published: shopifyProps.booleanChoice({
      displayName: 'Published',
      description: 'Yes publishes the page, No hides it. Leave empty to keep the current state.',
    }),
    publish_date: Property.DateTime({
      displayName: 'Publish Date',
      description: 'New publication date and time, ISO 8601.',
      required: false,
    }),
    template_suffix: Property.ShortText({
      displayName: 'Template Suffix',
      description: 'New theme template suffix.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const changes = shopifyValues.compact({
      title: shopifyValues.nonEmpty(propsValue.title),
      body: shopifyValues.nonEmpty(propsValue.body_html),
      handle: shopifyValues.nonEmpty(propsValue.handle),
      isPublished: shopifyValues.toBooleanChoice(propsValue.is_published),
      publishDate: shopifyValues.nonEmpty(propsValue.publish_date),
      templateSuffix: shopifyValues.nonEmpty(propsValue.template_suffix),
    });
    if (Object.keys(changes).length === 0) {
      throw new Error('Nothing to update: provide at least one field to change. Nothing was changed.');
    }
    const page = shopifyValues.compact({
      ...changes,
      redirectNewHandle: shopifyValues.toBooleanChoice(propsValue.redirect_new_handle),
    });
    const id = shopifyGraphqlClient.toGid({ type: 'Page', id: propsValue.page_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      pageUpdate: { page: GqlPage | null } | null;
    }>({
      auth,
      query: `mutation UpdatePage($id: ID!, $page: PageUpdateInput!) { pageUpdate(id: $id, page: $page) { page { ${shopifyFields.PAGE_FIELDS} } userErrors { field message code } } }`,
      variables: { id, page },
    });
    const updated = data.pageUpdate?.page;
    if (!updated) {
      throw new Error('Shopify did not return the updated page.');
    }
    return {
      ...shopifyMappers.mapPage(updated),
      redacted_fields: redactedFields,
    };
  },
});
