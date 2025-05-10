import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pdfCoAuth } from '../../index';

export const searchAndReplaceTextInPdf = createAction({
  name: 'searchAndReplaceTextInPdf',
  displayName: 'Search and Replace Text in PDF',
  description: 'Search for specific text or patterns in a PDF and replace them with new text.',
  auth: pdfCoAuth,
  props: {
    url: Property.ShortText({
      displayName: 'PDF URL',
      description: 'URL to the source PDF file',
      required: true,
    }),
    searchStrings: Property.Array({
      displayName: 'Search Strings',
      description: 'The strings to search for in the PDF',
      required: true,
    }),
    replaceStrings: Property.Array({
      displayName: 'Replace Strings',
      description: 'The replacement strings (must match the number of search strings)',
      required: true,
    }),
    replacementLimit: Property.Number({
      displayName: 'Replacement Limit',
      description: 'Limit the number of searches & replacements for every item (0 means unlimited)',
      required: false,
    }),
    caseSensitive: Property.Checkbox({
      displayName: 'Case Sensitive',
      description: 'Whether the search should be case sensitive',
      required: false,
      defaultValue: true,
    }),
    regex: Property.Checkbox({
      displayName: 'Use Regular Expressions',
      description: 'Set to true to use regular expressions for search strings',
      required: false,
      defaultValue: false,
    }),
    fileName: Property.ShortText({
      displayName: 'Output File Name',
      description: 'File name for the generated output',
      required: false,
    }),
    expiration: Property.Number({
      displayName: 'Expiration Time (minutes)',
      description: 'Set the expiration time for the output link in minutes (default is 60)',
      required: false,
    }),
    pages: Property.ShortText({
      displayName: 'Pages',
      description: 'Specify page indices as comma-separated values or ranges to process (e.g. "0, 1, 2-" or "1, 2, 3-7")',
      required: false,
    }),
    pdfPassword: Property.ShortText({
      displayName: 'PDF Password',
      description: 'Password if the PDF is protected',
      required: false,
    }),
    httpUsername: Property.ShortText({
      displayName: 'HTTP Username',
      description: 'HTTP auth username if required to access source url',
      required: false,
    }),
    httpPassword: Property.ShortText({
      displayName: 'HTTP Password',
      description: 'HTTP auth password if required to access source url',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth;
    const baseUrl = 'https://api.pdf.co/v1';
    
    const payload: Record<string, unknown> = {
      url: context.propsValue.url,
      searchStrings: context.propsValue.searchStrings,
      replaceStrings: context.propsValue.replaceStrings,
    };
    
    // Add optional parameters if provided
    if (context.propsValue.replacementLimit !== undefined) {
      payload['replacementLimit'] = context.propsValue.replacementLimit;
    }
    
    if (context.propsValue.caseSensitive !== undefined) {
      payload['caseSensitive'] = context.propsValue.caseSensitive;
    }
    
    if (context.propsValue.regex !== undefined) {
      payload['regex'] = context.propsValue.regex;
    }
    
    if (context.propsValue.fileName) {
      payload['name'] = context.propsValue.fileName;
    }
    
    if (context.propsValue.expiration !== undefined) {
      payload['expiration'] = context.propsValue.expiration;
    }
    
    if (context.propsValue.pages) {
      payload['pages'] = context.propsValue.pages;
    }
    
    if (context.propsValue.pdfPassword) {
      payload['password'] = context.propsValue.pdfPassword;
    }
    
    if (context.propsValue.httpUsername) {
      payload['httpusername'] = context.propsValue.httpUsername;
    }
    
    if (context.propsValue.httpPassword) {
      payload['httppassword'] = context.propsValue.httpPassword;
    }
    
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/pdf/edit/replace-text`,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    if (response.status !== 200) {
      throw new Error(`PDF.co API Error: ${response.status} ${JSON.stringify(response.body)}`);
    }

    return response.body;
  },
});
