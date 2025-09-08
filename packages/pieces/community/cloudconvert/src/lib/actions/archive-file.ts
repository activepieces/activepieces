import {
    createAction,
    Property,
    ActionContext,
} from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../common/auth';
import { CloudConvertClient } from '../common/client';

const archiveFileProps = {
    files: Property.Array({
        displayName: 'Files to Archive',
        description: 'List of files to include in the archive',
        required: true,
        properties: {
            url: Property.ShortText({
                displayName: 'File URL',
                required: true,
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
    engine: Property.ShortText({
        displayName: 'Engine',
        description: 'Archive engine to use',
        required: false,
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
        const { files, output_format, filename, engine, engine_version, timeout, wait_for_completion } = context.propsValue;

        if (!files || files.length === 0) {
            throw new Error('At least one file is required to create an archive');
        }

        const client = new CloudConvertClient(context.auth);

        try {
            const importTasks: string[] = [];
            for (const file of files as Array<{ url: string; filename?: string }>) {
                const importTask = await client.createImportTask(file.url, file.filename);
                importTasks.push(importTask.id);
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
                tasks[`import-file-${index + 1}`] = taskId;
            });
            tasks['create-archive'] = archiveTask.id;
            tasks['export-archive'] = exportTask.id;

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
});
