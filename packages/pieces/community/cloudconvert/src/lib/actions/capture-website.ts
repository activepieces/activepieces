import {
    createAction,
    Property,
    ActionContext,
} from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../common/auth';
import { CloudConvertClient } from '../common/client';

const captureWebsiteProps = {
    url: Property.ShortText({
        displayName: 'Website URL',
        description: 'The URL of the website to capture',
        required: true,
    }),
    output_format: Property.StaticDropdown({
        displayName: 'Output Format',
        description: 'The target format to convert to',
        required: true,
        options: {
            options: [
                { label: 'PDF', value: 'pdf' },
                { label: 'PNG', value: 'png' },
                { label: 'JPG', value: 'jpg' },
            ]
        }
    }),
    pages: Property.ShortText({
        displayName: 'Pages',
        description: 'Page range (e.g. 1-3) or comma separated list (e.g. 1,2,3)',
        required: false,
    }),
    zoom: Property.Number({
        displayName: 'Zoom',
        description: 'Zoom level to display the website (default: 1)',
        required: false,
    }),
    page_width: Property.Number({
        displayName: 'Page Width (cm)',
        description: 'Page width in cm',
        required: false,
    }),
    page_height: Property.Number({
        displayName: 'Page Height (cm)',
        description: 'Page height in cm',
        required: false,
    }),
    page_format: Property.StaticDropdown({
        displayName: 'Page Format',
        description: 'Paper format type when printing a PDF',
        required: false,
        options: {
            options: [
                { label: 'Letter', value: 'letter' },
                { label: 'Legal', value: 'legal' },
                { label: 'Tabloid', value: 'tabloid' },
                { label: 'Ledger', value: 'ledger' },
                { label: 'A0', value: 'a0' },
                { label: 'A1', value: 'a1' },
                { label: 'A2', value: 'a2' },
                { label: 'A3', value: 'a3' },
                { label: 'A4', value: 'a4' },
                { label: 'A5', value: 'a5' },
                { label: 'A6', value: 'a6' },
            ]
        }
    }),
    page_orientation: Property.StaticDropdown({
        displayName: 'Page Orientation',
        description: 'Page orientation (default: portrait)',
        required: false,
        options: {
            options: [
                { label: 'Portrait', value: 'portrait' },
                { label: 'Landscape', value: 'landscape' },
            ]
        }
    }),
    margin_top: Property.Number({
        displayName: 'Top Margin (mm)',
        description: 'Page top margin in mm',
        required: false,
    }),
    margin_bottom: Property.Number({
        displayName: 'Bottom Margin (mm)',
        description: 'Page bottom margin in mm',
        required: false,
    }),
    margin_left: Property.Number({
        displayName: 'Left Margin (mm)',
        description: 'Page left margin in mm',
        required: false,
    }),
    margin_right: Property.Number({
        displayName: 'Right Margin (mm)',
        description: 'Page right margin in mm',
        required: false,
    }),
    print_background: Property.Checkbox({
        displayName: 'Print Background',
        description: 'Render the background of websites (default: true)',
        required: false,
        defaultValue: true,
    }),
    display_header_footer: Property.Checkbox({
        displayName: 'Display Header/Footer',
        description: 'Create a header and footer with URL and page numbers',
        required: false,
        defaultValue: false,
    }),
    header_template: Property.LongText({
        displayName: 'Header Template',
        description: 'HTML template for the print header with classes: date, title, url, pageNumber, totalPages',
        required: false,
    }),
    footer_template: Property.LongText({
        displayName: 'Footer Template',
        description: 'HTML template for the print footer with classes: date, title, url, pageNumber, totalPages',
        required: false,
    }),
    wait_until: Property.StaticDropdown({
        displayName: 'Wait Until',
        description: 'When to consider navigation finished (default: load)',
        required: false,
        options: {
            options: [
                { label: 'Load', value: 'load' },
                { label: 'DOMContentLoaded', value: 'domcontentloaded' },
                { label: 'Network Idle 0', value: 'networkidle0' },
                { label: 'Network Idle 2', value: 'networkidle2' },
            ]
        }
    }),
    wait_for_element: Property.ShortText({
        displayName: 'Wait for Element',
        description: 'CSS selector for element to wait for (e.g. "body" or "#element")',
        required: false,
    }),
    wait_time: Property.Number({
        displayName: 'Wait Time (ms)',
        description: 'Additional time in ms to wait after page load',
        required: false,
    }),
    css_media_type: Property.StaticDropdown({
        displayName: 'CSS Media Type',
        description: 'Changes CSS media type of the page (default: print)',
        required: false,
        options: {
            options: [
                { label: 'Print', value: 'print' },
                { label: 'Screen', value: 'screen' },
            ]
        }
    }),
    filename: Property.ShortText({
        displayName: 'Filename',
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
        description: 'Wait for the capture to complete before returning',
        required: true,
        defaultValue: true,
    }),
} as const;

type CaptureWebsiteContext = ActionContext<typeof cloudconvertAuth, typeof captureWebsiteProps>;

export const captureWebsite = createAction({
    name: 'capture_website',
    displayName: 'Capture Website',
    description: 'Convert a website to PDF or capture a screenshot (PNG, JPG)',
    auth: cloudconvertAuth,
    requireAuth: true,
    props: captureWebsiteProps,
    async run(context: CaptureWebsiteContext) {
        const {
            url,
            output_format,
            pages,
            zoom,
            page_width,
            page_height,
            page_format,
            page_orientation,
            margin_top,
            margin_bottom,
            margin_left,
            margin_right,
            print_background,
            display_header_footer,
            header_template,
            footer_template,
            wait_until,
            wait_for_element,
            wait_time,
            css_media_type,
            filename,
            engine,
            engine_version,
            timeout,
            wait_for_completion,
        } = context.propsValue;

        const client = new CloudConvertClient(context.auth);

        try {
            const captureBody: any = {
                url,
                output_format,
            };

            if (pages) captureBody.pages = pages;
            if (zoom) captureBody.zoom = zoom;
            if (page_width) captureBody.page_width = page_width;
            if (page_height) captureBody.page_height = page_height;
            if (page_format) captureBody.page_format = page_format;
            if (page_orientation) captureBody.page_orientation = page_orientation;
            if (margin_top) captureBody.margin_top = margin_top;
            if (margin_bottom) captureBody.margin_bottom = margin_bottom;
            if (margin_left) captureBody.margin_left = margin_left;
            if (margin_right) captureBody.margin_right = margin_right;
            if (print_background !== undefined) captureBody.print_background = print_background;
            if (display_header_footer) captureBody.display_header_footer = display_header_footer;
            if (header_template) captureBody.header_template = header_template;
            if (footer_template) captureBody.footer_template = footer_template;
            if (wait_until) captureBody.wait_until = wait_until;
            if (wait_for_element) captureBody.wait_for_element = wait_for_element;
            if (wait_time) captureBody.wait_time = wait_time;
            if (css_media_type) captureBody.css_media_type = css_media_type;
            if (filename) captureBody.filename = filename;
            if (engine) captureBody.engine = engine;
            if (engine_version) captureBody.engine_version = engine_version;
            if (timeout) captureBody.timeout = timeout;

            const captureTask = await client.createCaptureTask(captureBody);

            const exportTask = await client.createExportTask(captureTask.id);

            const tasks: Record<string, string> = {
                'capture-website': captureTask.id,
                'export-capture': exportTask.id,
            };

            const job = await client.createJob(tasks, `capture-${Date.now()}`);

            if (wait_for_completion) {
                let attempts = 0;
                const maxAttempts = 60;

                while (attempts < maxAttempts) {
                    const currentJob = await client.getJob(job.id);

                    if (currentJob.status === 'finished') {
                        const exportTaskData = await client.getTask(exportTask.id);

                        return {
                            job: currentJob,
                            capture_task: captureTask,
                            export_task: exportTaskData,
                            download_url: exportTaskData.result?.files?.[0]?.url,
                            filename: exportTaskData.result?.files?.[0]?.filename,
                            url,
                            output_format,
                        };
                    } else if (currentJob.status === 'error') {
                        throw new Error(`Capture job failed: ${currentJob.message || 'Unknown error'}`);
                    }

                    await new Promise(resolve => setTimeout(resolve, 5000));
                    attempts++;
                }

                throw new Error('Capture did not complete within the timeout period');
            }

            return {
                job,
                capture_task: captureTask,
                export_task: exportTask,
                url,
                output_format,
                status: 'processing',
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Website capture failed: ${String(error)}`);
        }
    },
});
