import {
    createAction,
    Property,
    ActionContext,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth } from '../common/auth';
import { CloudConvertClient } from '../common/client';

const archiveFileProps = {
    import_method: Property.StaticDropdown({
        displayName: 'Import Method',
        description: 'How to import the files for archiving',
        required: true,
        options: {
            options: [
                { label: 'File Upload', value: 'upload' },
                { label: 'File URL', value: 'url' },
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
                required: false,
            }),
            file: Property.File({
                displayName: 'File',
                description: 'File to upload and archive',
                required: false,
            }),
            filename: Property.ShortText({
                displayName: 'Filename in Archive',
                required: false,
            })
        }
    }),
    output_format: Property.StaticDropdown({
        displayName: 'Archive Format',
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
        }
    }),
    filename: Property.ShortText({
        displayName: 'Archive Filename',
        description: 'Name for the archive file (including extension)',
        required: false,
    }),
    engine: Property.StaticDropdown({
        displayName: 'Engine',
        description: 'Archive engine to use',
        required: false,
        options: {
            options: [
                { label: '7-Zip (Default)', value: '7z' },
                { label: 'Zip', value: 'zip' },
                { label: 'Tar', value: 'tar' },
                { label: 'RAR', value: 'rar' },
            ]
        }
    }),
    engine_version: Property.ShortText({
        displayName: 'Engine Version',
        description: 'Specific engine version to use',
        required: false,
    }),
    timeout: Property.Number({
        displayName: 'Timeout (seconds)',
        description: 'Timeout in seconds after which the task will be cancelled',
        required: false,
    }),
    wait_for_completion: Property.Checkbox({
        displayName: 'Wait for Completion',
        description: 'Wait for the archive creation to complete',
        required: true,
        defaultValue: true,
    }),
} as const;

type ArchiveFileContext = ActionContext<typeof cloudconvertAuth, typeof archiveFileProps>;

export const archiveFile = createAction({
    name: 'archive_file',
    displayName: 'Create Archive',
    description: 'Creates a ZIP, RAR, 7Z, TAR, TAR.GZ or TAR.BZ2 archive',
    auth: cloudconvertAuth,
    requireAuth: true,
    props: archiveFileProps,
    async run(context: ArchiveFileContext) {
        const { import_method, files, output_format, filename, engine, engine_version, timeout, wait_for_completion } = context.propsValue;

        if (!files || files.length === 0) {
            throw new Error('At least one file is required to create an archive');
        }

        const client = new CloudConvertClient(context.auth);

        try {
            const importTasks: string[] = [];

            if (import_method === 'url') {
                // Handle URL import method
                for (const file of files as Array<{ url: string; filename?: string }>) {
                    if (!file.url) {
                        throw new Error('File URL is required when using URL import method');
                    }
                    const importTask = await client.createImportTask(file.url, file.filename);
                    importTasks.push(importTask.id);
                }
            } else if (import_method === 'upload') {
                // Handle file upload method
                for (const file of files as Array<{ file?: any; filename?: string }>) {
                    if (!file.file || !file.file.base64) {
                        throw new Error('Please select a file to upload from your device');
                    }

                    // Create upload task for each file
                    const uploadTask = await client.createUploadTask(file.file.filename || 'uploaded-file');

                    // Get upload URL and parameters
                    const uploadUrl = uploadTask.result.form.url;
                    const uploadForm = uploadTask.result.form.parameters;

                    // Prepare form data for upload
                    const formData = new FormData();

                    // Add form parameters
                    Object.entries(uploadForm).forEach(([key, value]) => {
                        formData.append(key, value as string);
                    });

                    // Add the file
                    if (file.file.base64) {
                        // Convert base64 to buffer for upload
                        const buffer = Buffer.from(file.file.base64, 'base64');
                        const blob = new Blob([buffer], { type: file.file.extension ? `application/${file.file.extension}` : 'application/octet-stream' });
                        formData.append('file', blob, file.file.filename);
                    }

                    // Upload the file
                    const uploadResponse = await httpClient.sendRequest({
                        method: HttpMethod.POST,
                        url: uploadUrl,
                        body: formData,
                    });

                    if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
                        throw new Error(`Failed to upload file: HTTP ${uploadResponse.status} - ${uploadResponse.body?.message || 'Upload failed'}`);
                    }

                    importTasks.push(uploadTask.id);
                }
            } else {
                throw new Error('Invalid import method selected');
            }

            const archiveTask = await client.createArchiveTask(
                importTasks,
                output_format,
                {
                    filename,
                    engine,
                    engineVersion: engine_version,
                    timeout,
                }
            );

            const exportTask = await client.createExportTask(archiveTask.id);

            const tasks: Record<string, string> = {};
            importTasks.forEach((taskId, index) => {
                tasks[import_method === 'url' ? `import/url-${index + 1}` : `import/upload-${index + 1}`] = taskId;
            });
            tasks['archive'] = archiveTask.id;
            tasks['export/url'] = exportTask.id;

            const job = await client.createJob(tasks, `archive-${Date.now()}`);

            if (wait_for_completion) {
                let attempts = 0;
                const maxAttempts = 60;

                while (attempts < maxAttempts) {
                    const currentJob = await client.getJob(job.id);

                    if (currentJob.status === 'finished') {
                        const exportTaskData = await client.getTask(exportTask.id);

                        return {
                            job: currentJob,
                            archive_task: archiveTask,
                            export_task: exportTaskData,
                            download_url: exportTaskData.result?.files?.[0]?.url,
                            filename: exportTaskData.result?.files?.[0]?.filename,
                            file_count: files.length,
                            output_format,
                            size: exportTaskData.result?.files?.[0]?.size || 0
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
                archive_task: archiveTask,
                export_task: exportTask,
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

    async test(context) {
        // For testing, return mock data to simulate successful file upload
        return {
            import_method: 'upload',
            files: [
                {
                    file: {
                        filename: 'test-sample.pdf',
                        base64: 'JVBERi0xLjcKCjEgMCBvYmogCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+CmVuZG9iag==',
                        extension: 'pdf'
                    },
                    filename: 'sample.pdf'
                }
            ],
            output_format: 'zip',
            filename: 'archive.zip',
            engine: '7z',
            wait_for_completion: true,
            message: 'Test successful - file archive simulation completed'
        };
    },
});
