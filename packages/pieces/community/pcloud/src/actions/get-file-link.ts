import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../index';
import { makeApiCall } from '../lib/common';

export const getFileLink = createAction({
  auth: pcloudAuth,
  name: 'get_file_link',
  displayName: 'Get File Link',
  description: 'Get a shareable download link for a file',
  props: {
    filePath: Property.ShortText({
      displayName: 'File Path',
      description: 'Full path to the file (e.g., /Documents/report.pdf)',
      required: true,
    }),
    linkExpiration: Property.StaticDropdown({
      displayName: 'Link Expiration',
      description: 'How long the link should remain valid',
      required: false,
      options: {
        options: [
          { label: '1 hour', value: '3600' },
          { label: '1 day', value: '86400' },
          { label: '7 days', value: '604800' },
          { label: '30 days', value: '2592000' },
          { label: 'Never expires', value: '0' },
        ],
      },
      defaultValue: '604800', // 7 days
    }),
  },
  async run(context) {
    const { filePath, linkExpiration } = context.propsValue;

    // Get file link
    const result = await makeApiCall(context.auth, 'getfilelink', {
      path: filePath,
      expire: linkExpiration || '604800',
    });

    return {
      success: true,
      downloadLink: `https://${result.hosts[0]}${result.path}`,
      expiresIn: linkExpiration === '0' ? 'Never' : `${parseInt(linkExpiration || '604800') / 3600} hours`,
      message: 'Download link generated successfully',
    };
  },
});
