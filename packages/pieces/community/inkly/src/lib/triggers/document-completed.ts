import { createTrigger, FilesService, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { inklyAuth } from '../auth';
import { inklyClient, InklyDocument } from '../common/client';
import { inklyOutput } from '../common/output';
import { inklySampleData } from '../common/sample-data';
import { inklyWebhook } from '../common/webhook';
import { inklyOutputSchemas } from '../output-schemas';

export const documentCompletedTrigger = createTrigger({
  auth: inklyAuth,
  name: 'document_completed',
  classification: 'READ',
  displayName: 'Document Completed',
  description: 'Triggers when everyone has signed a document. Includes the signed PDF and the values signers filled in.',
  aiMetadata: {
    description:
      'Fires once when every signer has signed an Inkly document, with the field values signers filled in and, by default, the signed PDF as a file.',
  },
  outputSchema: inklyOutputSchemas.documentCompleted,
  props: {
    include_signed_pdf: Property.Checkbox({
      displayName: 'Include Signed PDF',
      description: 'Attach the signed PDF as a file, ready to save to cloud storage or attach to an email.',
      required: false,
      defaultValue: true,
    }),
  },
  sampleData: inklySampleData.completed,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await inklyWebhook.enable({
      apiKey: context.auth.secret_text,
      webhookUrl: context.webhookUrl,
      event: EVENT,
      store: context.store,
    });
  },
  async onDisable(context) {
    await inklyWebhook.disable({ apiKey: context.auth.secret_text, store: context.store });
  },
  async test(context) {
    const apiKey = context.auth.secret_text;
    const includePdf = context.propsValue.include_signed_pdf !== false;
    const events = await inklyWebhook.samples({ apiKey, event: EVENT });
    return Promise.all(
      events.map(async ({ eventId, item }, index) => ({
        ...inklyOutput.event({ eventId, eventType: EVENT, item, withFieldValues: true }),
        ...(includePdf && index === 0 ? await signedPdf({ apiKey, item, files: context.files }) : {}),
      })),
    );
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const received = await inklyWebhook.receive({
      apiKey,
      event: EVENT,
      store: context.store,
      payload: context.payload,
    });
    if (!received) {
      return [];
    }
    const includePdf = context.propsValue.include_signed_pdf !== false;
    return [
      {
        ...inklyOutput.event({ eventId: received.eventId, eventType: EVENT, item: received.item, withFieldValues: true }),
        ...(includePdf ? await signedPdf({ apiKey, item: received.item, files: context.files }) : {}),
      },
    ];
  },
});

async function signedPdf({
  apiKey,
  item,
  files,
}: {
  apiKey: string;
  item: InklyDocument;
  files: FilesService;
}): Promise<{ signed_pdf: string; signed_pdf_file_name: string }> {
  const pdf = await inklyClient.downloadSignedPdf({ apiKey, documentId: item.id });
  const file = await files.write({ fileName: pdf.fileName, data: pdf.data });
  return { signed_pdf: file, signed_pdf_file_name: pdf.fileName };
}

const EVENT = 'document.completed';
