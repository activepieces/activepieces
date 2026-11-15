import {
  PieceAuth,
  Property,
  createAction,
  tryCatch,
} from '@activepieces/pieces-framework';
import { OfficeContentNode, OfficeErrorType, OfficeParser } from 'officeparser';
import { wordFile } from '../common/word-file';
import { extractTextActionOutputSchema } from '../output-schemas';

export const extractText = createAction({
  auth: PieceAuth.None(),
  audience: 'both',
  name: 'extract_text',
  classification: 'READ',
  displayName: 'Extract Text',
  description: 'Get the text, headers and footers of a Word document (.docx).',
  aiMetadata: {
    description:
      'Reads a Word document (.docx, .docm, .dotx, including password-protected ones) and returns its text in reading order: paragraphs, tables as aligned rows, lists, text boxes and footnotes, with page headers and footers returned separately. Use it to read a Word attachment or file before summarizing, classifying or parsing it; use Extract Text in the PDF piece for PDFs and Read File in Files Helper for plain-text files. Legacy .doc files are rejected with a request to save them as .docx; read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: extractTextActionOutputSchema,
  propertyGroups: [
    {
      key: 'input',
      display: 'section',
      label: 'Document',
      icon: 'paperclip',
      props: ['file', 'password'],
    },
  ],
  props: {
    file: Property.File({
      displayName: 'Word Document',
      description:
        'Pick a .docx file from an earlier step, such as an email attachment, or paste a URL to download.',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Only needed when the document is password-protected.',
      required: false,
    }),
  },
  async run(context) {
    const { file, password } = context.propsValue;
    if (wordFile.isLegacyDoc(file.data)) {
      throw new Error(wordFile.legacyDocMessage);
    }
    const { data: document, error } = await tryCatch(() =>
      OfficeParser.parseOffice(file.data, {
        fileType: 'docx',
        password: password || undefined,
      })
    );
    if (error) {
      throw new Error(describeParseError(error));
    }
    const { value: text } = await document.to('text', { includeImages: false });
    return {
      text,
      headers: joinUniqueText(document.auxiliary?.headers),
      footers: joinUniqueText(document.auxiliary?.footers),
    };
  },
});

function joinUniqueText(nodes: OfficeContentNode[] | undefined): string {
  const texts = (nodes ?? [])
    .map((node) => (node.text ?? '').trim())
    .filter((text) => text.length > 0);
  return [...new Set(texts)].join('\n');
}

function describeParseError(error: Error): string {
  const code = getOfficeErrorCode(error);
  if (code === OfficeErrorType.PASSWORD_REQUIRED) {
    return 'This document is password-protected. Enter its password in the Password field.';
  }
  if (code === OfficeErrorType.PASSWORD_INCORRECT) {
    return 'The password is incorrect for this document.';
  }
  return `This file could not be read as a Word document (.docx). It may be damaged or in a different format. Details: ${error.message}`;
}

function getOfficeErrorCode(error: Error): string | undefined {
  if (!('officeIssue' in error)) {
    return undefined;
  }
  const issue = error.officeIssue;
  if (
    typeof issue !== 'object' ||
    issue === null ||
    !('code' in issue) ||
    typeof issue.code !== 'string'
  ) {
    return undefined;
  }
  return issue.code;
}
