import { createAction } from '@activepieces/pieces-framework';
import { propsValidation, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth, CloudConvertClient, downloadFileSchema } from '../common';
import { Property } from '@activepieces/pieces-framework';

const downloadFileProps = () => ({
  task_id: Property.ShortText({
    displayName: 'Task ID',
    description: 'ID of the CloudConvert task to retrieve',
    required: true,
  }),
  include: Property.MultiSelectDropdown({
    displayName: 'Include Additional Data',
    description: 'Additional data to include in the response',
    required: false,
    refreshers: [],
    options: async () => ({
      options: [
        { label: 'Retries', value: 'retries' },
        { label: 'Depends On Tasks', value: 'depends_on_tasks' },
        { label: 'Payload', value: 'payload' },
        { label: 'Job', value: 'job' },
      ]
    })
  }),
  store_file: Property.Checkbox({
    displayName: 'Store File',
    description: 'Download and store the output files in Activepieces',
    required: false,
    defaultValue: true,
  }),
});

export const downloadFile = createAction({
  name: 'download_file',
  displayName: 'Download a File',
  description: 'Downloads output from a completed task',
  auth: cloudconvertAuth,
  requireAuth: true,
  props: downloadFileProps(),
  async run(context) {
    await downloadFileSchema.parseAsync(context.propsValue);

    const { task_id, include, store_file } = context.propsValue;

    const client = new CloudConvertClient(context.auth);

    try {
      const queryParams: Record<string, string> = {};
      if (include && Array.isArray(include) && include.length > 0) {
        queryParams['include'] = include.join(',');
      }

      const task = await client.getTask(task_id, queryParams);

      if (task.status !== 'finished') {
        throw new Error(`Task is not finished. Current status: ${task.status}. ${task.message || ''}`);
      }

      let downloadTask = task;
      let exportTaskId: string | undefined;

      if (task.operation !== 'export/url' && task.result?.files && task.result.files.length > 0) {
        const hasDownloadUrls = task.result.files.some((file: any) => file.url);
        
        if (!hasDownloadUrls) {
          try {
            const exportTask = await client.createExportTask(task_id);
            exportTaskId = exportTask.id;
            
            let attempts = 0;
            const maxAttempts = 60;
            
            while (attempts < maxAttempts) {
              const exportTaskData = await client.getTask(exportTask.id);
              
              if (exportTaskData.status === 'finished') {
                downloadTask = exportTaskData;
                break;
              } else if (exportTaskData.status === 'error') {
                throw new Error(`Export task failed: ${exportTaskData.message || 'Unknown error'}. Code: ${exportTaskData.code || 'N/A'}`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 2000));
              attempts++;
            }
            
            if (attempts >= maxAttempts) {
              throw new Error('Export task did not complete within the timeout period');
            }
          } catch (exportError) {
            // Continue with original task
          }
        }
      }

      const result: any = {
        id: task.id,
        job_id: task.job_id,
        name: task.name,
        operation: task.operation,
        status: task.status,
        message: task.message,
        code: task.code,
        credits: task.credits,
        created_at: task.created_at,
        started_at: task.started_at,
        ended_at: task.ended_at,
        engine: task.engine,
        engine_version: task.engine_version,
        ...(exportTaskId && { export_task_id: exportTaskId }),
      };

      if (task.depends_on_tasks) {
        result.depends_on_tasks = task.depends_on_tasks;
      }
      if (task.retry_of_task_id) {
        result.retry_of_task_id = task.retry_of_task_id;
      }
      if (task.retries) {
        result.retries = task.retries;
      }
      if (task.payload) {
        result.payload = task.payload;
      }
      if (downloadTask.result) {
        result.result = downloadTask.result;

        if (downloadTask.result.files && downloadTask.result.files.length > 0) {
          result.download_urls = downloadTask.result.files.map((file: any) => ({
            filename: file.filename,
            url: file.url,
            size: file.size,
          }));

          if (store_file) {
            result.stored_files = [];
            
            for (const file of downloadTask.result.files) {
              try {
                if (!file.url || typeof file.url !== 'string') {
                  continue;
                }
                
                try {
                  new URL(file.url);
                } catch (urlError) {
                  continue;
                }
                
                const fileResponse = await httpClient.sendRequest({
                  method: HttpMethod.GET,
                  url: file.url,
                });

                if (fileResponse.status === 200 && fileResponse.body) {
                  let fileData: Buffer;
                  if (typeof fileResponse.body === 'string') {
                    fileData = Buffer.from(fileResponse.body, 'binary');
                  } else {
                    fileData = Buffer.from(fileResponse.body as ArrayBuffer);
                  }
                  
                  const storedFileId = await context.files.write({
                    data: fileData,
                    fileName: file.filename || `downloaded-file-${Date.now()}`,
                  });
                  
                  result.stored_files.push({
                    filename: file.filename,
                    size: file.size,
                    stored_file_id: storedFileId,
                    original_url: file.url,
                  });
                }
              } catch (error) {
                // Continue with next file
              }
            }
          }
        }
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Task retrieval failed: ${String(error)}`);
    }
    },

   
});
