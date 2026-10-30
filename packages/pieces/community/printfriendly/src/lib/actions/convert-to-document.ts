import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { printfriendlyAuth } from '../auth';
import { printfriendlyApi } from '../common/client';
import type {
  AsyncConvertResponse,
  ConvertRequest,
  ConvertResponse,
} from '../common/types';

export const convertToDocument = createAction({
  auth: printfriendlyAuth,
  name: 'convert_to_document',
  classification: 'WRITE',
  displayName: 'Convert to Document',
  description:
    'Convert a web page, HTML, or Markdown into a clean PDF, Word, Markdown, HTML, JSON, or text document.',
  audience: 'both',
  aiMetadata: {
    description:
      'Converts a web page, HTML, or Markdown into a PDF, Word, Markdown, HTML, JSON, or plain text document. Use Read Page when you only need the article as Markdown, or Get Job to collect the result of a background conversion. Each successful conversion creates a new document and consumes one document from the plan, so retries use another document.',
    idempotent: false,
  },
  props: {
    sourceType: Property.StaticDropdown({
      displayName: 'Source Type',
      description:
        'Choose what to convert, then fill in the matching source field below.',
      required: true,
      defaultValue: 'url',
      options: {
        options: [
          { label: 'Web Page URL', value: 'url' },
          { label: 'HTML', value: 'html' },
          { label: 'Markdown', value: 'markdown' },
        ],
      },
    }),
    url: Property.ShortText({
      displayName: 'Page URL',
      description:
        'Public http(s) URL of the page to convert. Use this field when Source Type is Web Page URL. Example: https://en.wikipedia.org/wiki/Eclipse',
      required: false,
    }),
    html: Property.LongText({
      displayName: 'HTML',
      description:
        'HTML markup to convert, up to 2 MB. Use this field when Source Type is HTML. Scripts and unsafe markup are removed.',
      required: false,
    }),
    markdown: Property.LongText({
      displayName: 'Markdown',
      description:
        'Markdown content to convert, up to 1 MB. Use this field when Source Type is Markdown. Headings, lists, tables, and code blocks are supported.',
      required: false,
    }),
    output: Property.StaticDropdown({
      displayName: 'Output Format',
      description:
        'Format of the document to create. PDF and Word return a download link; Markdown, HTML, and text return the content directly; JSON returns the article as structured fields.',
      required: true,
      defaultValue: 'pdf',
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'Word (DOCX)', value: 'docx' },
          { label: 'Markdown', value: 'markdown' },
          { label: 'HTML', value: 'html' },
          { label: 'JSON', value: 'json' },
          { label: 'Plain Text', value: 'text' },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description:
        "Title to print above HTML or Markdown content. Ignored for web page URLs, which use the page's own title.",
      required: false,
    }),
    pageSize: Property.StaticDropdown({
      displayName: 'Page Size',
      description:
        'Page size for PDF and Word output. Ignored for other formats.',
      required: false,
      defaultValue: 'letter',
      options: {
        options: [
          { label: 'Letter', value: 'letter' },
          { label: 'A4', value: 'a4' },
        ],
      },
    }),
    includeLinks: Property.Checkbox({
      displayName: 'Include Links',
      description:
        'Keep link and image addresses in Markdown and plain text output. When off, links keep their words and lose their addresses.',
      required: false,
      defaultValue: false,
    }),
    runInBackground: Property.Checkbox({
      displayName: 'Run in Background',
      description:
        'Queue the conversion and return a job ID immediately. Use Get Job to retrieve the result. Useful for slow pages or large documents.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      sourceType,
      url,
      html,
      markdown,
      output,
      title,
      pageSize,
      includeLinks,
      runInBackground,
    } = context.propsValue;

    const body: ConvertRequest = {
      output,
      ...(title ? { title } : {}),
      ...(pageSize && (output === 'pdf' || output === 'docx')
        ? { page_size: pageSize }
        : {}),
      ...(includeLinks && (output === 'markdown' || output === 'text')
        ? { include_links: true }
        : {}),
    };

    if (sourceType === 'html') {
      body.html = requireSource({ value: html, label: 'HTML' });
    } else if (sourceType === 'markdown') {
      body.markdown = requireSource({ value: markdown, label: 'Markdown' });
    } else {
      body.url = requireSource({ value: url, label: 'Page URL' });
    }

    if (runInBackground) {
      body.async = true;
      const response = await printfriendlyApi.call<AsyncConvertResponse>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        path: printfriendlyApi.convertPath,
        body,
      });
      return printfriendlyApi.flattenAsyncConvertResponse(response);
    }

    const response = await printfriendlyApi.call<ConvertResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: printfriendlyApi.convertPath,
      body,
    });
    return printfriendlyApi.flattenConvertResponse(response);
  },
});

function requireSource(params: {
  value: string | undefined;
  label: string;
}): string {
  if (params.value === undefined || params.value.trim().length === 0) {
    throw new Error(
      `${params.label} is required for the selected source type.`
    );
  }
  return params.value;
}
