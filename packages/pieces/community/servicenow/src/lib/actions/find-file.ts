import { createAction, Property } from '@activepieces/pieces-framework';
import { servicenowAuth } from '../../auth';
import { callServiceNowApi, ServiceNowApiResponse, ServiceNowRecord } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findFile = createAction({
  auth: servicenowAuth,
  name: 'find_file',
  displayName: 'Find File',
  description: 'Find a file (attachment) by filename',
  props: {
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the file to search for (supports wildcards with *)',
      required: true,
    }),
    tableName: Property.ShortText({
      displayName: 'Table Name (optional)',
      description: 'Specific table to search in (leave empty to search all tables)',
      required: false,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID (optional)',
      description: 'Specific record ID to search in (leave empty to search all records)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of files to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { fileName, tableName, recordId, limit } = context.propsValue;
    const auth = context.auth as any;

    try {
      let query = `file_nameLIKE${fileName}`;
      
      if (tableName) {
        query += `^table_name=${tableName}`;
      }
      
      if (recordId) {
        query += `^table_sys_id=${recordId}`;
      }

      const queryParams: Record<string, string> = {
        sysparm_query: query,
        sysparm_limit: (limit || 10).toString(),
        sysparm_fields: 'sys_id,file_name,table_name,table_sys_id,size_bytes,content_type,sys_created_on',
      };

      const response = await callServiceNowApi<ServiceNowApiResponse<ServiceNowRecord[]>>(
        HttpMethod.GET,
        auth,
        '/sys_attachment',
        undefined,
        queryParams
      );

      return {
        files: response.result || [],
        count: response.result?.length || 0,
      };
    } catch (error) {
      console.error('Error finding files:', error);
      throw error;
    }
  },
});
