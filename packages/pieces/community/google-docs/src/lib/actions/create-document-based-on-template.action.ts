import { googleDocsAuth, createGoogleClient, GoogleDocsAuthValue } from '../auth';
import { InputPropertyMap, Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs } from '@googleapis/docs';
import { drive as googleDrive } from '@googleapis/drive';
import { editTemplateActionOutputSchema } from '../output-schemas';
import { documentIdProp, folderIdPropWith } from '../common/props';
import { toImageReplacements } from '../common/image-replacements';
import { PlaceholderFormat, TemplateScan, templateFill } from '../common/template-fill';
import {
  buildImageInputs,
  buildPlaceholderInputs,
  runTemplateFill,
  TemplateClients,
  templateNote,
} from '../common/template-fill-run';

export const createDocumentBasedOnTemplate = createAction({
  auth: googleDocsAuth,
  name: 'create_document_based_on_template',
  classification: 'WRITE',
  description:
    'Fill a template by replacing its placeholders with your values.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fills a Google Docs template by replacing placeholder tokens (for example {{name}} or [[name]]) with supplied values, and can swap images picked by their alt text or object ID. By default it copies the template and fills the copy, so the template stays reusable; set create_copy to false to write into the document itself. Pass the values in fields (one input per placeholder, listed once template and placeholder_format are set) or as key/value pairs in values, with key names without brackets, plus the matching placeholder_format. A swapped image loses its alt text, so with create_copy off an image can be picked by alt text only once. Returns the filled document ID and URL, how many times each placeholder was replaced, the placeholders that were not found and the ones left unfilled. Not idempotent while create_copy is on: each call creates a new document.',
    idempotent: false,
  },
  displayName: 'Fill Template',
  propertyGroups: [
    {
      key: 'document',
      display: 'section',
      label: 'Template',
      icon: 'file',
      props: ['template'],
    },
    {
      key: 'destination',
      display: 'section',
      label: 'Save As',
      icon: 'send',
      props: ['create_copy'],
    },
    {
      key: 'placeholders',
      display: 'section',
      label: 'Placeholders',
      icon: 'tag',
      props: ['placeholder_format', 'fields', 'values'],
    },
    {
      key: 'images',
      display: 'section',
      label: 'Images',
      icon: 'paperclip',
      props: ['image_fields', 'images'],
    },
  ],
  props: {
    template: documentIdProp({
      displayName: 'Template',
      description: 'The Google Doc that holds your placeholders.',
    }),
    create_copy: Property.Checkbox({
      displayName: 'Create a New Document',
      description: 'Fill a copy and keep the template unchanged.',
      required: false,
      defaultValue: true,
      reveals: ['new_document_name', 'folder'],
    }),
    new_document_name: Property.ShortText({
      displayName: 'New Document Name',
      description: "Leave empty to use 'Copy of' plus the template's name.",
      placeholder: 'Invoice for Acme',
      required: false,
    }),
    folder: folderIdPropWith({
      description: 'Leave empty to save next to the template.',
    }),
    placeholder_format: Property.StaticDropdown({
      displayName: 'Placeholder Format',
      required: true,
      defaultValue: 'square_brackets',
      display: 'cards',
      options: {
        options: [
          { label: '{{KEY}}', value: 'curly_braces', description: 'Double curly braces' },
          { label: '[[KEY]]', value: 'square_brackets', description: 'Double square brackets' },
          { label: '{KEY}', value: 'single_curly', description: 'Single curly braces' },
          { label: '[KEY]', value: 'single_square', description: 'Single square brackets' },
        ],
      },
    }),
    fields: Property.DynamicProperties({
      auth: googleDocsAuth,
      displayName: 'Values',
      description: 'One input per placeholder found in the template.',
      required: false,
      refreshers: ['template', 'placeholder_format'],
      props: async ({ auth, template, placeholder_format }) =>
        templateInputs({
          auth,
          template,
          placeholderFormat: placeholder_format,
          build: buildPlaceholderInputs,
          onUnreadable: () =>
            templateNote('The placeholders of this document could not be listed. Add them under Variables instead.'),
        }),
    }),
    values: Property.Object({
      displayName: 'Variables',
      description: 'Names without brackets. A value here wins over the input above.',
      required: false,
    }),
    image_fields: Property.DynamicProperties({
      auth: googleDocsAuth,
      displayName: 'Images in the Template',
      description: 'One input per image found in the template.',
      required: false,
      refreshers: ['template'],
      props: async ({ auth, template }) =>
        templateInputs({
          auth,
          template,
          placeholderFormat: undefined,
          build: buildImageInputs,
          onUnreadable: () => ({}),
        }),
    }),
    images: Property.Array({
      displayName: 'Image Replacements',
      description: 'Swap an image by its alt text. The new image has no alt text.',
      required: false,
      properties: {
        imageObjectId: Property.ShortText({
          displayName: 'Image',
          description:
            "The image's alt text or its object ID. To set the alt text in Google Docs, right-click the image and choose Alt text.",
          required: true,
          placeholder: 'logo',
        }),
        url: Property.ShortText({
          displayName: 'New Image URL',
          required: true,
          placeholder: 'https://example.com/logo.png',
        }),
      },
    }),
    fail_on_missing: Property.Checkbox({
      displayName: 'Fail on Missing Placeholder',
      description: 'Stop before writing when a placeholder with a value is not found.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  },
  outputSchema: editTemplateActionOutputSchema,
  async run(context) {
    const { propsValue } = context;

    return runTemplateFill({
      clients: await createTemplateClients(context.auth),
      input: {
        templateId: propsValue.template,
        format: templateFill.resolveFormat(propsValue.placeholder_format),
        createCopy: propsValue.create_copy === true,
        newDocumentName: propsValue.new_document_name?.trim() || undefined,
        folderId: propsValue.folder || undefined,
        values: propsValue.values,
        fields: propsValue.fields,
        images: toImageReplacements(propsValue.images),
        imageFields: propsValue.image_fields,
        failOnMissing: propsValue.fail_on_missing === true,
      },
    });
  },
});

async function templateInputs({
  auth,
  template,
  placeholderFormat,
  build,
  onUnreadable,
}: {
  auth: GoogleDocsAuthValue | undefined;
  template: unknown;
  placeholderFormat: unknown;
  build: (params: { scan: TemplateScan; format: PlaceholderFormat }) => InputPropertyMap;
  onUnreadable: () => InputPropertyMap;
}): Promise<InputPropertyMap> {
  if (!auth || typeof template !== 'string' || template.length === 0) {
    return {};
  }
  const format = templateFill.resolveFormat(placeholderFormat);
  try {
    const clients = await createTemplateClients(auth);
    const document = await clients.getDocument(template);
    return build({ scan: templateFill.scan({ document, format }), format });
  } catch {
    return onUnreadable();
  }
}

async function createTemplateClients(auth: GoogleDocsAuthValue): Promise<TemplateClients> {
  const authClient = await createGoogleClient(auth);
  const docs = googleDocs({ version: 'v1', auth: authClient });
  const drive = googleDrive({ version: 'v3', auth: authClient });

  return {
    getDocument: async (documentId) => {
      const response = await docs.documents.get({
        documentId,
        includeTabsContent: true,
        fields: TEMPLATE_FIELDS,
      });
      return response.data;
    },
    batchUpdate: async ({ documentId, requests }) => {
      const response = await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
      });
      return response.data;
    },
    copyFile: async ({ fileId, name, folderId }) => {
      const response = await drive.files.copy({
        fileId,
        supportsAllDrives: true,
        fields: 'id, name',
        requestBody: {
          ...(name ? { name } : {}),
          ...(folderId ? { parents: [folderId] } : {}),
        },
      });
      if (!response.data.id) {
        throw new Error('Google Drive did not return the ID of the new document.');
      }
      return { id: response.data.id, name: response.data.name ?? name ?? '' };
    },
    trashFile: async (fileId) => {
      await drive.files.update({
        fileId,
        supportsAllDrives: true,
        requestBody: { trashed: true },
      });
    },
  };
}

const PARAGRAPH_FIELDS = 'paragraph(elements(textRun(content),inlineObjectElement(inlineObjectId)),positionedObjectIds)';

const TEMPLATE_FIELDS = `title,tabs(tabProperties(tabId),documentTab(body(content(${PARAGRAPH_FIELDS},table,tableOfContents)),headers,footers,footnotes,inlineObjects,positionedObjects),childTabs)`;
