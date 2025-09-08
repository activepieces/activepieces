import {
    createAction,
    Property,
    ActionContext,
} from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../common/auth';
import { CloudConvertClient } from '../common/client';

const mergePdfProps = {
    files: Property.Array({
        displayName: 'Files to Merge',
        description: 'List of files to merge into a single PDF',
        required: true,
        properties: {
            url: Property.ShortText({
                displayName: 'File URL',
                description: 'URL of the file to merge',
                required: true,
            }),
            filename: Property.ShortText({
                displayName: 'Filename in PDF',
                description: 'Optional filename for this file within the PDF',
                required: false,
            })
        }
    }),
    filename: Property.ShortText({
        displayName: 'Output Filename',
        description: 'Choose a filename (including extension) for the output file',
        required: false,
    }),
    engine: Property.ShortText({
        displayName: 'Engine',
        description: 'Use a specific engine for the conversion',
        required: false,
    }),
    engine_version: Property.ShortText({
        displayName: 'Engine Version',
        description: 'Use a specific engine version for the conversion',
        required: false,
    }),
    timeout: Property.Number({
        displayName: 'Timeout (seconds)',
        description: 'Timeout in seconds after which the task will be cancelled',
        required: false,
    }),
    wait_for_completion: Property.Checkbox({
        displayName: 'Wait for Completion',
        description: 'Wait for the merge to complete before returning',
        required: true,
        defaultValue: true,
    }),
} as const;

type MergePdfContext = ActionContext<typeof cloudconvertAuth, typeof mergePdfProps>;

export const mergePdf = createAction({
    name: 'merge_pdf',
    displayName: 'Merge to PDF',
    description: 'Merge multiple files into a single PDF',
    auth: cloudconvertAuth,
    requireAuth: true,
    props: mergePdfProps,
    async run(context: MergePdfContext) {
        const { files, filename, engine, engine_version, timeout, wait_for_completion } = context.propsValue;

        if (!files || files.length < 2) {
            throw new Error('At least 2 files are required for merging');
        }

        const client = new CloudConvertClient(context.auth);

        try {
            const importTasks: string[] = [];
            for (const file of files as Array<{ url: string; filename?: string }>) {
                const importTask = await client.createImportTask(file.url, file.filename);
                importTasks.push(importTask.id);
            }

            const mergeBody: any = {
                input: importTasks.length === 1 ? importTasks[0] : importTasks,
                output_format: 'pdf',
            };

            if (filename) mergeBody.filename = filename;
            if (engine) mergeBody.engine = engine;
            if (engine_version) mergeBody.engine_version = engine_version;
            if (timeout) mergeBody.timeout = timeout;

            const mergeTask = await client.createMergeTask(mergeBody);

            const exportTask = await client.createExportTask(mergeTask.id);

            const tasks: Record<string, string> = {};
            importTasks.forEach((taskId, index) => {
                tasks[`import-file-${index + 1}`] = taskId;
            });
            tasks['merge-files'] = mergeTask.id;
            tasks['export-merged'] = exportTask.id;

            const job = await client.createJob(tasks, `merge-${Date.now()}`);

            if (wait_for_completion) {
                let attempts = 0;
                const maxAttempts = 60;

                while (attempts < maxAttempts) {
                    const currentJob = await client.getJob(job.id);

                    if (currentJob.status === 'finished') {
                        const exportTaskData = await client.getTask(exportTask.id);

                        return {
                            job: currentJob,
                            merge_task: mergeTask,
                            export_task: exportTaskData,
                            download_url: exportTaskData.result?.files?.[0]?.url,
                            filename: exportTaskData.result?.files?.[0]?.filename,
                            file_count: files.length,
                            output_format: 'pdf',
                        };
                    } else if (currentJob.status === 'error') {
                        throw new Error(`Merge job failed: ${currentJob.message || 'Unknown error'}`);
                    }

                    await new Promise(resolve => setTimeout(resolve, 5000));
                    attempts++;
                }

                throw new Error('Merge did not complete within the timeout period');
            }

            return {
                job,
                merge_task: mergeTask,
                export_task: exportTask,
                file_count: files.length,
                output_format: 'pdf',
                status: 'processing',
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Merge failed: ${String(error)}`);
        }
    },
});
