import { createAction, Property } from '@activepieces/pieces-framework';
import { predefinedMimeTypes } from '../common/mimeTypes';
import mime from 'mime-types';
import { checkFileTypeActionOutputSchema } from '../output-schemas';

export const checkFileType = createAction({
  audience: 'both',
  name: 'checkFileType',
  classification: 'READ',
  displayName: 'Check File Type',
  description: "Detect a file's type and check it against the one you pick.",
  aiMetadata: { description: 'Determines the MIME type of a file from its extension and reports whether it matches the selected MIME type. Use it as a guard before a format-specific step (e.g. only continue for images or PDFs); use Get File Name if you only want the name, or Read File to get the contents. Detection is extension-based only - contents are never sniffed, so the extension is trusted as-is and only a missing or unrecognized one falls back to application/octet-stream; read-only and idempotent.', idempotent: true },
  outputSchema: checkFileTypeActionOutputSchema,
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'Pick a file from an earlier step or paste a URL to download.',
      required: true,
    }),
    mimeTypes: Property.StaticDropdown({
      displayName: 'Expected File Type',
      required: true,
      options: {
        options: predefinedMimeTypes,
      },
      description: 'Matched against the type worked out from the file extension.',
    }),
  },
  async run(context) {
    const file = context.propsValue.file;

    const selectedMimeType = context.propsValue.mimeTypes;
    const fileType = file.extension ? mime.lookup(file.extension) || 'application/octet-stream' : 'application/octet-stream';

    const isMatch = Array.isArray(selectedMimeType)
      ? selectedMimeType.includes(fileType)
      : fileType === selectedMimeType;

    return {
      mimeType: fileType,
      isMatch,
    };
  },
});
