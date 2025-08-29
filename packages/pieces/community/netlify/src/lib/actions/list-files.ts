import { createAction, Property } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { NetlifyClient } from '../common/client';
import { deployIdProperty, validateRequiredFields, formatFileSize } from '../common/utils';

export const listFilesAction = createAction({
  auth: netlifyAuth,
  name: 'list_files',
  displayName: 'List Files',
  description: 'List files in a specific Netlify deployment',
  props: {
    deployId: deployIdProperty,
    filterByPath: Property.ShortText({
      displayName: 'Filter by Path',
      description: 'Filter files by path pattern (e.g., "*.html", "assets/*")',
      required: false
    })
  },
  async run(context) {
    const { deployId, filterByPath } = context.propsValue;
    const client = new NetlifyClient(context.auth);

    try {
      // Validate inputs
      validateRequiredFields({ deployId }, ['deployId']);

      // Get deployment files
      const files = await client.getDeployFiles(deployId);

      // Filter files if pattern is provided
      let filteredFiles = files;
      if (filterByPath && filterByPath.trim() !== '') {
        const pattern = filterByPath.trim();
        
        if (pattern.includes('*')) {
          // Simple wildcard matching
          const regex = new RegExp(
            '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
          );
          filteredFiles = files.filter((file: any) => regex.test(file.path));
        } else {
          // Exact match or contains
          filteredFiles = files.filter((file: any) => 
            file.path.includes(pattern) || file.path === pattern
          );
        }
      }

      // Format the response
      const formattedFiles = filteredFiles.map((file: any) => ({
        id: file.id,
        path: file.path,
        sha: file.sha,
        size: file.size,
        formattedSize: formatFileSize(file.size),
        mimeType: file.mime_type,
        url: file.url || null
      }));

      // Calculate total size
      const totalSize = formattedFiles.reduce((sum, file) => sum + file.size, 0);

      return {
        success: true,
        files: formattedFiles,
        total: formattedFiles.length,
        totalSize,
        formattedTotalSize: formatFileSize(totalSize),
        deployId,
        filter: filterByPath || 'none',
        message: `Retrieved ${formattedFiles.length} file(s) successfully`
      };

    } catch (error: any) {
      throw new Error(`Failed to list deployment files: ${error.message}`);
    }
  }
});
