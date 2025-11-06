import { createAction } from '@activepieces/pieces-framework';
import { propsValidation, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth, CloudConvertClient, captureWebsiteSchema } from '../common';
import { Property } from '@activepieces/pieces-framework';

const captureWebsiteProps = () => ({
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
    },
    defaultValue: 'pdf'
  }),
  pages: Property.ShortText({
    displayName: 'Pages',
    description: 'Page range (e.g. 1-3) or comma separated list (e.g. 1,2,3) of pages',
    required: false,
  }),
  zoom: Property.Number({
    displayName: 'Zoom Level',
    description: 'Zoom level to display the website. Defaults to 1',
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
    description: 'Paper format type when printing a PDF. Overrides page_width and page_height',
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
    description: 'Page orientation for PDF output',
    required: false,
    options: {
      options: [
        { label: 'Portrait', value: 'portrait' },
        { label: 'Landscape', value: 'landscape' },
      ]
    },
    defaultValue: 'portrait'
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
    description: 'Render the background of websites',
    required: false,
    defaultValue: true,
  }),
  display_header_footer: Property.Checkbox({
    displayName: 'Display Header/Footer',
    description: 'Create a header and a footer with the URL and page numbers',
    required: false,
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
    description: 'When to consider navigation finished',
    required: false,
    options: {
      options: [
        { label: 'Load Event', value: 'load' },
        { label: 'DOMContentLoaded', value: 'domcontentloaded' },
        { label: 'Network Idle (0 connections)', value: 'networkidle0' },
        { label: 'Network Idle (2 connections)', value: 'networkidle2' },
      ]
    },
    defaultValue: 'load'
  }),
  wait_for_element: Property.ShortText({
    displayName: 'Wait for Element',
    description: 'CSS selector for element to wait for (e.g. "body" or "#element")',
    required: false,
  }),
  wait_time: Property.Number({
    displayName: 'Wait Time (ms)',
    description: 'Additional time in ms to wait after the page load',
    required: false,
  }),
  css_media_type: Property.StaticDropdown({
    displayName: 'CSS Media Type',
    description: 'Changes the CSS media type of the page',
    required: false,
    options: {
      options: [
        { label: 'Print', value: 'print' },
        { label: 'Screen', value: 'screen' },
      ]
    },
    defaultValue: 'print'
  }),
  filename: Property.ShortText({
    displayName: 'Output Filename',
    description: 'Choose a filename (including extension) for the output file',
    required: false,
    defaultValue: 'captured-website'
  }),
  engine: Property.StaticDropdown({
    displayName: 'Engine',
    description: 'Use a specific engine for the conversion',
    required: false,
    options: {
      options: [
        { label: 'Chrome (Default)', value: 'chrome' },
        { label: 'wkhtmltopdf', value: 'wkhtml' },
      ]
    }
  }),
  engine_version: Property.ShortText({
    displayName: 'Engine Version',
    description: 'Use a specific engine version for the conversion',
    required: false,
  }),
  timeout: Property.Number({
    displayName: 'Timeout (seconds)',
    description: 'Timeout in seconds after the task will be cancelled',
    required: false,
  }),
  wait_for_completion: Property.Checkbox({
    displayName: 'Wait for Completion',
    description: 'Wait for the capture to complete before returning',
    required: true,
    defaultValue: true,
  }),
  store_file: Property.Checkbox({
    displayName: 'Store File',
    description: 'Download and store the captured file in Activepieces',
    required: false,
    defaultValue: true,
  }),
});

export const captureWebsite = createAction({
  name: 'capture_website',
  displayName: 'Capture Website',
  description: 'Capture webpage as PDF, screenshot PNG, or JPG from a URL',
  auth: cloudconvertAuth,
  requireAuth: true,
  props: captureWebsiteProps(),
  async run(context) {
    await captureWebsiteSchema.parseAsync(context.propsValue);

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
      store_file
    } = context.propsValue;

    const client = new CloudConvertClient(context.auth);

    try {
      const captureOptions: any = {
        url,
        output_format,
      };

      if (pages) captureOptions.pages = pages;
      if (zoom !== undefined) captureOptions.zoom = zoom;
      if (page_width !== undefined) captureOptions.page_width = page_width;
      if (page_height !== undefined) captureOptions.page_height = page_height;
      if (page_format) captureOptions.page_format = page_format;
      if (page_orientation) captureOptions.page_orientation = page_orientation;
      if (margin_top !== undefined) captureOptions.margin_top = margin_top;
      if (margin_bottom !== undefined) captureOptions.margin_bottom = margin_bottom;
      if (margin_left !== undefined) captureOptions.margin_left = margin_left;
      if (margin_right !== undefined) captureOptions.margin_right = margin_right;
      if (print_background !== undefined) captureOptions.print_background = print_background;
      if (display_header_footer !== undefined) captureOptions.display_header_footer = display_header_footer;
      if (header_template) captureOptions.header_template = header_template;
      if (footer_template) captureOptions.footer_template = footer_template;
      if (wait_until) captureOptions.wait_until = wait_until;
      if (wait_for_element) captureOptions.wait_for_element = wait_for_element;
      if (wait_time !== undefined) captureOptions.wait_time = wait_time;
      if (css_media_type) captureOptions.css_media_type = css_media_type;
      if (filename) captureOptions.filename = filename;
      if (engine) captureOptions.engine = engine;
      if (engine_version) captureOptions.engine_version = engine_version;
      if (timeout !== undefined) captureOptions.timeout = timeout;

      const captureTask = await client.createCaptureTask(captureOptions);

      if (wait_for_completion) {
        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
          const currentTask = await client.getTask(captureTask.id);

          if (currentTask.status === 'finished') {
            break;
          } else if (currentTask.status === 'error') {
            throw new Error(`Capture task failed: ${currentTask.message || 'Unknown error'}`);
          }

          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
        }

        if (attempts >= maxAttempts) {
          throw new Error('Capture task did not complete within the timeout period');
        }
      }

      const exportTask = await client.createExportTask(captureTask.id);

      if (wait_for_completion) {
        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
          const exportTaskData = await client.getTask(exportTask.id);

          if (exportTaskData.status === 'finished') {
            const downloadUrl = exportTaskData.result?.files?.[0]?.url;
            const filename = exportTaskData.result?.files?.[0]?.filename || 'captured-website.pdf';

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
                    fileName: filename,
                  });
                }
              } catch (error) {
                // Continue without throwing
              }
            }

            return {
              capture_task: captureTask,
              export_task: exportTaskData,
              download_url: downloadUrl,
              filename,
              stored_file_id: storedFileId,
              url,
              output_format,
            };
          } else if (exportTaskData.status === 'error') {
            throw new Error(`Export task failed: ${exportTaskData.message || 'Unknown error'}`);
          }

          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
        }

        throw new Error('Export did not complete within the timeout period');
      }

      return {
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