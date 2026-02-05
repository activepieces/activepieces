import { createAction } from '@activepieces/pieces-framework';
import { propsValidation, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth, CloudConvertClient, archiveFileSchema } from '../common';
import { Property } from '@activepieces/pieces-framework';

const archiveFileProps = () => ({
  import_method: Property.StaticDropdown({
    displayName: 'Import Method',
    description: 'How to import the files for archiving',
    required: true,
    options: {
      options: [
        { label: 'File Upload', value: 'upload' },
        { label: 'File URL', value: 'url' },
        { label: 'Stored File ID', value: 'stored_file' },
      ]
    },
    defaultValue: 'upload'
  }),
  files: Property.Array({
    displayName: 'Files to Archive',
    description: 'List of files to include in the archive',
    required: true,
    properties: {
      url: Property.ShortText({
        displayName: 'File URL',
        description: 'URL of the file to archive',
        required: false,
      }),
      file: Property.File({
        displayName: 'File',
        description: 'File to upload and archive',
        required: false,
      }),
      stored_file_id: Property.ShortText({
        displayName: 'Stored File ID',
        description: 'ID of a previously stored file in Activepieces to archive',
        required: false,
      }),
      filename: Property.ShortText({
        displayName: 'Filename in Archive',
        description: 'Optional filename for this file within the archive',
        required: false,
      })
    }
  }),
  output_format: Property.StaticDropdown({
    displayName: 'Archive Format',
    description: 'The archive format to create',
    required: true,
    options: {
      options: [
        { label: 'ZIP', value: 'zip' },
        { label: 'RAR', value: 'rar' },
        { label: '7Z', value: '7z' },
        { label: 'TAR', value: 'tar' },
        { label: 'TAR.GZ', value: 'targz' },
        { label: 'TAR.BZ2', value: 'tarbz2' },
      ]
    },
    defaultValue: 'zip'
  }),
  filename: Property.ShortText({
    displayName: 'Archive Filename',
    description: 'Choose a filename (including extension) for the archive file',
    required: false,
    defaultValue: 'archive.zip'
  }),
  engine: Property.StaticDropdown({
    displayName: 'Engine',
    description: 'Use a specific engine for the archiving',
    required: false,
    options: {
      options: [
        { label: '7-Zip', value: '7z' },
        { label: 'Archive Tool (Default)', value: 'archivetool' },
      ]
    }
  }),
  engine_version: Property.ShortText({
    displayName: 'Engine Version',
    description: 'Use a specific engine version for the archiving',
    required: false,
  }),
  timeout: Property.Number({
    displayName: 'Timeout (seconds)',
    description: 'Timeout in seconds after which the task will be cancelled',
    required: false,
  }),
  wait_for_completion: Property.Checkbox({
    displayName: 'Wait for Completion',
    description: 'Wait for the archive creation to complete before returning',
    required: true,
    defaultValue: true,
  }),
  store_file: Property.Checkbox({
    displayName: 'Store File',
    description: 'Download and store the created archive in Activepieces',
    required: false,
    defaultValue: true,
  }),
});

export const archiveFile = createAction({
  name: 'archive_file',
  displayName: 'Archive File',
  description: 'Creates a ZIP, RAR, 7Z, TAR, TAR.GZ or TAR.BZ2 archive',
  auth: cloudconvertAuth,
  requireAuth: true,
  props: archiveFileProps(),
  async run(context) {
    await archiveFileSchema.parseAsync(context.propsValue);
        const { import_method, files, output_format, filename, engine, engine_version, timeout, wait_for_completion, store_file } = context.propsValue;

        if (!files || files.length === 0) {
            throw new Error('At least one file is required to create an archive');
        }

        const client = new CloudConvertClient(context.auth);

        try {
            const jobTasks: Record<string, any> = {};

            files.forEach((file: any, index: number) => {
                const taskName = `import-file-${index + 1}`;

                if (import_method === 'url') {
                    if (!file.url) {
                        throw new Error(`File URL is required for file ${index + 1} when using URL import method`);
                    }
                    jobTasks[taskName] = {
                        operation: 'import/url',
                        url: file.url,
                        ...(file.filename && { filename: file.filename })
                    };
                } else if (import_method === 'stored_file') {
                    if (!file.stored_file_id) {
                        throw new Error(`Stored File ID is required for file ${index + 1} when using stored file import method`);
                    }
                    if (!context.server?.apiUrl) {
                        throw new Error('Server API URL is not available. Please check your Activepieces server configuration.');
                    }
                    const baseUrl = context.server.apiUrl.replace(/\/$/, '');
                    const fileUrl = `${baseUrl}/v1/step-files/${file.stored_file_id}`;

                    try {
                        new URL(fileUrl);
                    } catch (urlError) {
                        throw new Error(`Invalid file URL constructed: ${fileUrl}. URL Error: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
                    }
                    jobTasks[taskName] = {
                        operation: 'import/url',
                        url: fileUrl,
                        ...(file.filename && { filename: file.filename })
                    };
                } else if (import_method === 'upload') {
                    if (!file.file || !file.file.base64) {
                        throw new Error(`Please select a file to upload for file ${index + 1}`);
                    }
                    throw new Error('Upload method for multiple files is not yet supported with the new job format. Please use URL or stored file methods.');
                } else {
                    throw new Error('Invalid import method selected');
                }
            });

            // Collect all import task names
            const importTaskNames = files.map((_, index) => `import-file-${index + 1}`);

            // Archive task
            const archiveOptions: any = {
                input: importTaskNames.length === 1 ? importTaskNames[0] : importTaskNames,
                output_format,
            };

            if (filename) archiveOptions.filename = filename;
            if (engine) archiveOptions.engine = engine;
            if (engine_version) archiveOptions.engine_version = engine_version;
            if (timeout) archiveOptions.timeout = timeout;

            jobTasks['archive-files'] = {
                operation: 'archive',
                ...archiveOptions
            };

            // Export task
            jobTasks['export-file'] = {
                operation: 'export/url',
                input: 'archive-files'
            };

            const job = await client.createJob(jobTasks, `archive-${Date.now()}`);

            if (wait_for_completion) {
                let attempts = 0;
                const maxAttempts = 60;

                while (attempts < maxAttempts) {
                    const currentJob = await client.getJob(job.id);

                    if (currentJob.status === 'finished') {
                        // Find the export task by name in the job
                        const exportTaskData = currentJob.tasks?.find((task: any) => task.name === 'export-file');
                        const downloadUrl = exportTaskData?.result?.files?.[0]?.url;
                        const outputFilename = exportTaskData?.result?.files?.[0]?.filename || `archive.${output_format}`;

                        let storedFileId: string | undefined;
                        if (store_file && downloadUrl) {
                            try {
                                const fileResponse = await httpClient.sendRequest({
                                    method: HttpMethod.GET,
                                    url: downloadUrl,
                                });

                                if (fileResponse.status === 200 && fileResponse.body) {
                                    let fileData: Buffer;
                                    if (typeof fileResponse.body === 'string') {
                                        fileData = Buffer.from(fileResponse.body, 'binary');
                                    } else {
                                        fileData = Buffer.from(fileResponse.body as ArrayBuffer);
                                    }
                                    storedFileId = await context.files.write({
                                        data: fileData,
                                        fileName: outputFilename,
                                    });
                                }
                            } catch (error) {
                                // Continue without throwing
                            }
                        }

                        return {
                            job: currentJob,
                            download_url: downloadUrl,
                            filename: outputFilename,
                            stored_file_id: storedFileId,
                            file_count: files.length,
                            output_format,
                            size: exportTaskData?.result?.files?.[0]?.size || 0
                        };
                    } else if (currentJob.status === 'error') {
                        throw new Error(`Archive job failed: ${currentJob.message || 'Unknown error'}`);
                    }

                    await new Promise(resolve => setTimeout(resolve, 5000));
                    attempts++;
                }

                throw new Error('Archive creation did not complete within the timeout period');
            }

            return {
                job,
                file_count: files.length,
                output_format,
                status: 'processing'
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Archive creation failed: ${String(error)}`);
        }
    },

    
});
