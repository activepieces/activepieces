import { InputPropertyMap, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { docs_v1 } from '@googleapis/docs';
import { ImageReplacement } from './image-replacements';
import { FillSummary, PlaceholderFormat, TemplateScan, templateFill } from './template-fill';

export async function runTemplateFill({
  clients,
  input,
}: {
  clients: TemplateClients;
  input: TemplateFillInput;
}): Promise<TemplateFillOutput> {
  const template = await clients.getDocument(input.templateId);
  const scan = templateFill.scan({ document: template, format: input.format });
  const plan = templateFill.plan({
    scan,
    format: input.format,
    values: input.values,
    fields: input.fields,
    images: input.images,
    imageFields: input.imageFields,
  });

  if (input.failOnMissing && plan.missing.length > 0) {
    throw new Error(
      `These placeholders were not found in the template: ${plan.missing.join(', ')}. Nothing was changed.`,
    );
  }

  const target = input.createCopy
    ? await clients.copyFile({ fileId: input.templateId, name: input.newDocumentName, folderId: input.folderId })
    : { id: input.templateId, name: template.title ?? '' };

  const data = await applyRequests({ clients, documentId: target.id, requests: plan.requests, isCopy: input.createCopy });

  return {
    documentId: target.id,
    documentName: target.name,
    documentUrl: `https://docs.google.com/document/d/${target.id}/edit`,
    templateId: input.templateId,
    createdNewDocument: input.createCopy,
    ...templateFill.summarize({ scan, plan, replies: data.replies ?? [] }),
    data,
  };
}

export function buildPlaceholderInputs({
  scan,
  format,
}: {
  scan: TemplateScan;
  format: PlaceholderFormat;
}): InputPropertyMap {
  if (scan.placeholders.length === 0) {
    return templateNote(
      `No ${format.replace('KEY', 'name')} placeholders were found in this document. Check the Placeholder Format, or type a placeholder like ${format.replace('KEY', 'name')} into the template.`,
    );
  }
  const listed = scan.placeholders.slice(0, MAX_INPUTS);
  const inputs = Object.fromEntries(
    listed.map(({ key }) => [key, Property.ShortText({ displayName: key, required: false })]),
  );
  if (scan.placeholders.length > MAX_INPUTS) {
    return {
      ...templateNote(
        `Showing the first ${MAX_INPUTS} of ${scan.placeholders.length} placeholders. Add the rest under Variables.`,
      ),
      ...inputs,
    };
  }
  return inputs;
}

export function buildImageInputs({ scan }: { scan: TemplateScan }): InputPropertyMap {
  return Object.fromEntries(
    scan.images.slice(0, MAX_INPUTS).map((image, index) => [
      image.objectId,
      Property.ShortText({
        displayName: templateFill.imageLabel({ image, index }),
        description: 'Link to the new image. Leave empty to keep this image.',
        placeholder: 'https://example.com/logo.png',
        required: false,
      }),
    ]),
  );
}

export function templateNote(message: string): InputPropertyMap {
  return {
    [NOTE_KEY]: Property.MarkDown({ value: message, variant: MarkdownVariant.INFO }),
  };
}

async function applyRequests({
  clients,
  documentId,
  requests,
  isCopy,
}: {
  clients: TemplateClients;
  documentId: string;
  requests: docs_v1.Schema$Request[];
  isCopy: boolean;
}): Promise<docs_v1.Schema$BatchUpdateDocumentResponse> {
  if (requests.length === 0) {
    return { documentId, replies: [] };
  }
  try {
    return await clients.batchUpdate({ documentId, requests });
  } catch (error) {
    if (!isCopy) {
      throw error;
    }
    const cleanupError = await clients.trashFile(documentId).then(
      () => undefined,
      (trashError: unknown) => trashError,
    );
    if (cleanupError === undefined) {
      throw error;
    }
    throw new Error(
      `${errorMessage(error)} The new document ${documentId} could not be moved to the trash (${errorMessage(cleanupError)}). Delete it by hand.`,
      { cause: error },
    );
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const MAX_INPUTS = 100;

const NOTE_KEY = 'template_note';

export type TemplateClients = {
  getDocument: (documentId: string) => Promise<docs_v1.Schema$Document>;
  batchUpdate: (params: {
    documentId: string;
    requests: docs_v1.Schema$Request[];
  }) => Promise<docs_v1.Schema$BatchUpdateDocumentResponse>;
  copyFile: (params: { fileId: string; name?: string; folderId?: string }) => Promise<{ id: string; name: string }>;
  trashFile: (fileId: string) => Promise<void>;
};

export type TemplateFillInput = {
  templateId: string;
  format: PlaceholderFormat;
  createCopy: boolean;
  newDocumentName?: string;
  folderId?: string;
  values?: unknown;
  fields?: unknown;
  images?: ImageReplacement[];
  imageFields?: unknown;
  failOnMissing: boolean;
};

export type TemplateFillOutput = FillSummary & {
  documentId: string;
  documentName: string;
  documentUrl: string;
  templateId: string;
  createdNewDocument: boolean;
  data: docs_v1.Schema$BatchUpdateDocumentResponse;
};
