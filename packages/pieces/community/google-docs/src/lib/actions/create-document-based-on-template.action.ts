/* eslint-disable @typescript-eslint/no-explicit-any */
import { googleDocsAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { flattenDoc, moveFileToFolder } from '../common';
import { documentIdProp, folderIdProp } from '../common/props';

export const createDocumentBasedOnTemplate = createAction({
  auth: googleDocsAuth,
  name: 'create_document_based_on_template',
  description:
    'Copy a template document and replace placeholder variables (and optionally images) with your values.',
  displayName: 'Create Document from Template',
  props: {
    template: documentIdProp('Template Document', 'The Google Doc to use as the template.'),
    copyTemplate: Property.Checkbox({
      displayName: 'Copy template before editing?',
      description:
        'When enabled (recommended), the template is duplicated and placeholders are replaced on the copy — leaving your template untouched. Disable to edit the template document in place (legacy behavior).',
      required: false,
      defaultValue: true,
    }),
    newDocumentTitle: Property.ShortText({
      displayName: 'New Document Title',
      description: 'Title for the new document (only used when copying the template).',
      required: false,
    }),
    folderId: folderIdProp,
    placeholder_format: Property.StaticDropdown({
      displayName: 'Placeholder Format',
      description:
        'The format placeholders use in your template. Pick this before filling in Variables so the keys below match what is in the document.',
      required: true,
      defaultValue: 'square_brackets',
      options: {
        disabled: false,
        options: [
          { label: 'Curly Braces {{KEY}}', value: 'curly_braces' },
          { label: 'Square Brackets [[KEY]]', value: 'square_brackets' },
          { label: 'Single Curly Braces {KEY}', value: 'single_curly' },
          { label: 'Single Square Brackets [KEY]', value: 'single_square' },
        ],
      },
    }),
    values: Property.Object({
      displayName: 'Variables',
      description:
        'Keys are placeholder names without the format markers. For example, use `name` (not `[[name]]` or `{{name}}`). Values are what the placeholders are replaced with.',
      required: true,
    }),
    images: Property.Object({
      displayName: 'Images',
      description:
        'Key: image object ID (obtain from the Read Document action), Value: new image URL. Leave empty if you do not want to replace images.',
      required: false,
    }),
  },
  async run(context) {
    const {
      template,
      copyTemplate = true,
      newDocumentTitle,
      folderId,
      values,
      images,
      placeholder_format,
    } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);
    const docs = google.docs({ version: 'v1', auth: authClient });
    const drive = google.drive({ version: 'v3', auth: authClient });

    let targetDocumentId = template;

    if (copyTemplate) {
      const copied = await drive.files.copy({
        fileId: template,
        supportsAllDrives: true,
        requestBody: {
          name: newDocumentTitle || undefined,
        },
      });
      if (!copied.data.id) {
        throw new Error('Failed to copy template document.');
      }
      targetDocumentId = copied.data.id;

      if (folderId) {
        await moveFileToFolder({ drive, fileId: targetDocumentId, folderId });
      }
    }

    const placeholderTemplate = PLACEHOLDER_FORMATS[placeholder_format] ?? '[[KEY]]';
    const requests: any[] = [];

    for (const key in values) {
      const value = values[key];
      requests.push({
        replaceAllText: {
          containsText: {
            text: placeholderTemplate.replace('KEY', key),
            matchCase: true,
          },
          replaceText: value == null ? '' : String(value),
        },
      });
    }

    if (images) {
      for (const key in images) {
        requests.push({
          replaceImage: {
            imageObjectId: key,
            uri: String(images[key]),
          },
        });
      }
    }

    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId: targetDocumentId,
        requestBody: { requests },
      });
    }

    const finalDoc = await docs.documents.get({ documentId: targetDocumentId });
    return flattenDoc(finalDoc.data);
  },
});

const PLACEHOLDER_FORMATS: Record<string, string> = {
  curly_braces: '{{KEY}}',
  square_brackets: '[[KEY]]',
  single_curly: '{KEY}',
  single_square: '[KEY]',
};
