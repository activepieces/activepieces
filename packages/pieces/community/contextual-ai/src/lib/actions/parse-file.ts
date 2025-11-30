import { createAction, Property } from "@activepieces/pieces-framework";
import { contextualAiAuth } from "../../index";
import { ContextualAI } from 'contextual-client';

export const parseFileAction = createAction({
  auth: contextualAiAuth,
  name: 'parse_file',
  displayName: 'Parse File',
  description: 'Parse a document file into structured Markdown and/or JSON format',
  props: {
    file: Property.File({
      displayName: 'Document File',
      description: 'The document file to parse (PDF, DOC, DOCX, PPT, PPTX)',
      required: true,
    }),
    parseMode: Property.StaticDropdown({
      displayName: 'Parse Mode',
      description: 'Parsing mode - basic for simple text, standard for complex documents',
      required: true,
      options: {
        options: [
          { label: 'Basic (text-only)', value: 'basic' },
          { label: 'Standard (complex documents)', value: 'standard' },
        ],
      },
      defaultValue: 'standard',
    }),
    pageRange: Property.ShortText({
      displayName: 'Page Range',
      description: 'Optional page range to parse (e.g., "0,1,2" or "0-2,5,6")',
      required: false,
    }),
    enableDocumentHierarchy: Property.Checkbox({
      displayName: 'Enable Document Hierarchy',
      description: 'Add table of contents with document structure (beta feature)',
      required: false,
      defaultValue: false,
    }),
    enableSplitTables: Property.Checkbox({
      displayName: 'Enable Split Tables',
      description: 'Split large tables into multiple tables with headers',
      required: false,
      defaultValue: false,
    }),
    maxSplitTableCells: Property.Number({
      displayName: 'Max Split Table Cells',
      description: 'Threshold for splitting large tables (only used when split tables is enabled)',
      required: false,
    }),
    figureCaptionMode: Property.StaticDropdown({
      displayName: 'Figure Caption Mode',
      description: 'How thorough figure captions should be',
      required: false,
      options: {
        options: [
          { label: 'Concise', value: 'concise' },
          { label: 'Detailed (beta)', value: 'detailed' },
        ],
      },
      defaultValue: 'concise',
    }),
  },
  async run({ auth, propsValue }) {
    const { apiKey, baseUrl } = auth.props;
    const {
      file,
      parseMode,
      pageRange,
      enableDocumentHierarchy,
      enableSplitTables,
      maxSplitTableCells,
      figureCaptionMode,
    } = propsValue;

    const client = new ContextualAI({
      apiKey: apiKey,
      baseURL: baseUrl || 'https://api.contextual.ai/v1',
    });

    const parseParams: any = {
      raw_file: file.data,
      parse_mode: parseMode,
    };

    if (pageRange) parseParams.page_range = pageRange;
    if (enableDocumentHierarchy !== undefined) parseParams.enable_document_hierarchy = enableDocumentHierarchy;
    if (enableSplitTables !== undefined) parseParams.enable_split_tables = enableSplitTables;
    if (maxSplitTableCells !== undefined) parseParams.max_split_table_cells = maxSplitTableCells;
    if (figureCaptionMode) parseParams.figure_caption_mode = figureCaptionMode;

    const response = await client.parse.create(parseParams);

    return {
      job_id: response.job_id,
      status: 'Parse job started. Use the job ID to check status and get results.',
    };
  },
});
