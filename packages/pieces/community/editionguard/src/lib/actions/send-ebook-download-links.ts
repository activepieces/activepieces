import { createAction, Property } from '@activepieces/pieces-framework';
import { editionguardAuth } from '../common/auth';
import { editionguardApi } from '../common/api';

export const sendEbookDownloadLinks = createAction({
  auth: editionguardAuth,
  name: 'send_ebook_download_links',
  displayName: 'Send eBook Download Links',
  description:
    'Creates a transaction for an eBook and sends the download link(s) to your customer. Returns the download link you can deliver by email or any other channel.',
  props: {
    resource_id: Property.Dropdown({
      displayName: 'eBook',
      description: 'Select the eBook to send to your customer.',
      auth: editionguardAuth,
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
        }
        try {
          const books = await editionguardApi.listBooks({ token: auth.secret_text });
          return {
            disabled: false,
            options: books.map((book) => ({
              label: `${book.title} (${book.drm_type ?? 'Unknown DRM'})`,
              value: book.resource_id,
            })),
          };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load eBooks. Check your connection.' };
        }
      },
    }),
    customer_email: Property.ShortText({
      displayName: 'Customer Email',
      description: "The customer's email address where the download instructions will be sent.",
      required: true,
    }),
    order_number: Property.ShortText({
      displayName: 'Order Number',
      description:
        'Your order or transaction reference number (e.g. from your eCommerce platform). Used for tracking and reporting.',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description:
        'Number of download links to generate. Use 1 for a single copy. Increase for multi-seat or multi-device licenses.',
      required: false,
      defaultValue: 1,
    }),
    watermark_name: Property.ShortText({
      displayName: "Customer's Full Name (Social DRM)",
      description:
        "Only applies when the eBook uses **Social DRM (EditionMark)**. The customer's name will be embedded as a visible watermark in the eBook. Leave empty for Adobe DRM or Readium LCP books.",
      required: false,
    }),
    watermark_email: Property.ShortText({
      displayName: "Customer's Email for Watermark (Social DRM)",
      description:
        "Only applies when the eBook uses **Social DRM (EditionMark)**. This email will be embedded as a watermark. Leave empty for Adobe DRM or Readium LCP books.",
      required: false,
    }),
    watermark_phone: Property.ShortText({
      displayName: "Customer's Phone for Watermark (Social DRM)",
      description:
        "Only applies when the eBook uses **Social DRM (EditionMark)**. This phone number will be embedded as a watermark. Leave empty for Adobe DRM or Readium LCP books.",
      required: false,
    }),
  },
  async run(context) {
    const { resource_id, customer_email, order_number, quantity, watermark_name, watermark_email, watermark_phone } =
      context.propsValue;

    const transaction = await editionguardApi.createTransaction({
      token: context.auth.secret_text,
      resourceId: resource_id,
      customerEmail: customer_email,
      orderNumber: order_number,
      quantity: quantity ?? 1,
      watermarkName: watermark_name ?? undefined,
      watermarkEmail: watermark_email ?? undefined,
      watermarkPhone: watermark_phone ?? undefined,
    });

    return transaction
  },
});
