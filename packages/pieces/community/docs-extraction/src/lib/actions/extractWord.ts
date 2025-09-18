import { Property, createAction } from '@activepieces/pieces-framework';
import JSZip from "jszip";

export const extractWordAction = createAction({
  name: 'extract_text_from_word_doc',
  displayName: 'Extract text from Word document',
  description: 'Extract text content from a Microsoft Word (.docx) document',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    file: Property.File({
      displayName: 'Word Document',
      description: 'Upload a Microsoft Word (.docx) document',
      required: true,
    }),
  },
  async run(context) {
    const { file } = context.propsValue;

    // Validate file extension
    if (!file.extension || !file.extension.toLowerCase().endsWith('docx')) {
      throw new Error('Invalid file type. Please upload a .docx file.');
    }

    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(file.base64, 'base64');

      // Extract text from DOCX using built-in modules
      const text = await extractTextFromDocxBuffer(buffer);

      // Return the extracted text
      return {
        text: text || '',
        success: true,
      };
    } catch (error: any) {
      console.error('Error extracting text:', error);
      throw new Error(
        `Failed to extract text from DOCX file: ${error.message}`
      );
    }
  },
});

async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  try {
    // DOCX is a ZIP file, use built-in ZIP functionality
    const zip = await JSZip.loadAsync(buffer);

    // Get the main document content
    const documentFile = zip.file('word/document.xml');
    if (!documentFile) {
      throw new Error('Invalid DOCX file: document.xml not found');
    }

    const xmlContent = await documentFile.async('text');

    // Basic XML text extraction (remove XML tags)
    const text = xmlContent
      .replace(/<[^>]*>/g, ' ') // Remove XML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return text;
  } catch (error: any) {
    // Fallback: simple approach without ZIP parsing
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));

    // Extract readable text from the buffer (basic approach)
    const extractedText = text
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Keep only printable ASCII chars
      .replace(/\s+/g, ' ')
      .trim();

    if (extractedText.length > 50) {
      return extractedText;
    }

    throw new Error('Could not extract meaningful text from the DOCX file');
  }
}
