import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { documentproAuth } from '../common/auth';

export const runExtract = createAction({
  auth: documentproAuth,
  name: 'runExtract',
  displayName: 'Run Extract',
  description: 'Run an extract/workflow on an uploaded document',
  props: {
    document_id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The unique identifier of the document to parse',
      required: true,
    }),
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'The unique identifier of the Workflow/template to use',
      required: true,
    }),
    use_ocr: Property.Checkbox({
      displayName: 'Use OCR',
      description:
        'Enable OCR processing (required for gpt-3.5-turbo or OCR-related parameters)',
      required: false,
      defaultValue: false,
    }),
    query_model: Property.StaticDropdown({
      displayName: 'Query Model',
      description: 'The AI model to use for parsing',
      required: false,
      defaultValue: 'gpt-4o-mini',
      options: {
        options: [
          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
        ],
      },
    }),
    detect_layout: Property.Checkbox({
      displayName: 'Detect Layout',
      description: 'Detect document layout (requires use_ocr=true)',
      required: false,
      defaultValue: false,
    }),
    detect_tables: Property.Checkbox({
      displayName: 'Detect Tables',
      description: 'Detect tables in the document (requires use_ocr=true)',
      required: false,
      defaultValue: false,
    }),
    page_ranges: Property.ShortText({
      displayName: 'Page Ranges',
      description: 'Specify which pages to parse (e.g., "1-3,5,7-9")',
      required: false,
    }),
    chunk_by_pages: Property.Number({
      displayName: 'Chunk by Pages',
      description: 'Number of pages per segment for method 1 segmentation',
      required: false,
    }),
    rolling_window: Property.Number({
      displayName: 'Rolling Window',
      description: 'Window size for method 2 segmentation',
      required: false,
    }),
    start_regex: Property.ShortText({
      displayName: 'Start Regex',
      description:
        'Regex pattern for where parsing should begin (requires use_ocr=true)',
      required: false,
    }),
    end_regex: Property.ShortText({
      displayName: 'End Regex',
      description:
        'Regex pattern for where parsing should end (requires use_ocr=true)',
      required: false,
    }),
    split_regex: Property.ShortText({
      displayName: 'Split Regex',
      description:
        'Regex pattern to split the document into sections (requires use_ocr=true)',
      required: false,
    }),
    use_all_matches: Property.Checkbox({
      displayName: 'Use All Matches',
      description:
        'Use all regex matches instead of just the first (requires use_ocr=true)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const params = new URLSearchParams();

    params.append('template_id', context.propsValue.template_id);

    if (context.propsValue.use_ocr) {
      params.append('use_ocr', 'true');
    }
    if (context.propsValue.query_model) {
      params.append('query_model', context.propsValue.query_model);
    }
    if (context.propsValue.detect_layout) {
      params.append('detect_layout', 'true');
    }
    if (context.propsValue.detect_tables) {
      params.append('detect_tables', 'true');
    }
    if (context.propsValue.page_ranges) {
      params.append('page_ranges', context.propsValue.page_ranges);
    }
    if (context.propsValue.chunk_by_pages) {
      params.append(
        'chunk_by_pages',
        context.propsValue.chunk_by_pages.toString()
      );
    }
    if (context.propsValue.rolling_window) {
      params.append(
        'rolling_window',
        context.propsValue.rolling_window.toString()
      );
    }
    if (context.propsValue.start_regex) {
      params.append('start_regex', context.propsValue.start_regex);
    }
    if (context.propsValue.end_regex) {
      params.append('end_regex', context.propsValue.end_regex);
    }
    if (context.propsValue.split_regex) {
      params.append('split_regex', context.propsValue.split_regex);
    }
    if (context.propsValue.use_all_matches) {
      params.append('use_all_matches', 'true');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.documentpro.ai/v1/documents/${
        context.propsValue.document_id
      }/run_parser?${params.toString()}`,
      headers: {
        'x-api-key': context.auth.secret_text,
        Accept: 'application/json',
      },
    });

    return response.body;
  },
});
