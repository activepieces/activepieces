import { createAction, Property } from '@activepieces/pieces-framework';
import { predefinedMimeTypes } from '../common/mimeTypes';
import mime from 'mime-types';

export const checkFileType = createAction({
  name: 'checkFileType',
  displayName: 'Check file type',
  description: 'Check MIME type of a file and filter based on selected types',
  props: {
    file: Property.File({
      displayName: 'File to Check',
      required: true,
    }),
    mimeTypes: Property.StaticDropdown({
      displayName: 'Select MIME Types',
      required: true,
      options: {
        options: predefinedMimeTypes,
      }, 
      description: 'Choose one or more MIME types to check against the file.',
    }),
  },
  async run(context) {
    const file = context.propsValue.file;
    
    const selectedMimeTypes = context.propsValue.mimeTypes;

    // Determine the MIME type of the file
    const fileType = file.extension ? mime.lookup(file.extension) || 'application/octet-stream' : 'application/octet-stream';

    // Check if the file's MIME type matches any of the selected MIME types.
    const isMatch = fileType && selectedMimeTypes.includes(fileType);

    return {
      mimeType: fileType || 'unknown',
      isMatch,
    };
  },
});
