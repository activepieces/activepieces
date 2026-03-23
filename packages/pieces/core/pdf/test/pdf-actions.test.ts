import { readFileSync } from 'fs';
import { join } from 'path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { pageRangeToIndexes } from '../src/lib/actions/extract-pdf-pages';

async function createTestPdf(pageCount = 1, textPerPage?: string[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([595, 842]);
    const text = textPerPage?.[i] ?? `Page ${i + 1}`;
    page.drawText(text, { x: 50, y: 800, size: 12, font });
  }
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

function loadFixturePdf(): Buffer {
  return readFileSync(join(__dirname, 'data', '05-versions-space.pdf'));
}

function makeFileProperty(buffer: Buffer, filename = 'test.pdf') {
  return {
    filename,
    extension: 'pdf',
    data: buffer,
  };
}

function createMockContext(propsValue: Record<string, unknown>) {
  const writtenFiles: Array<{ data: Buffer; fileName: string }> = [];
  return {
    propsValue,
    files: {
      write: async (params: { data: Buffer; fileName: string }) => {
        writtenFiles.push(params);
        return `file:///${params.fileName}`;
      },
    },
    auth: {},
    store: {} as any,
    connections: {} as any,
    tags: [] as any,
    server: {} as any,
    run: {} as any,
    generateResumeUrl: (() => '') as any,
    writtenFiles,
  };
}

describe('pageRangeToIndexes', () => {
  test('should throw error if start more than end', () => {
    expect(() => pageRangeToIndexes(5, 3, 10)).toThrow();
  });

  test('should throw error on start 0', () => {
    expect(() => pageRangeToIndexes(0, 10, 10)).toThrow();
  });

  test('should throw error on end 0', () => {
    expect(() => pageRangeToIndexes(0, 10, 10)).toThrow();
  });

  test('should throw error if start more than total pages', () => {
    expect(() => pageRangeToIndexes(10, 10, 5)).toThrow();
  });

  test('should throw error if end more than total pages', () => {
    expect(() => pageRangeToIndexes(1, 11, 5)).toThrow();
  });

  test('should throw error start negative when end positive', () => {
    expect(() => pageRangeToIndexes(-1, 4, 10)).toThrow();
  });

  test('should succeed with positive range', () => {
    expect(pageRangeToIndexes(1, 4, 10)).toStrictEqual([0, 1, 2, 3]);
  });

  test('should succeed with positive range of 1 value', () => {
    expect(pageRangeToIndexes(5, 5, 10)).toStrictEqual([4]);
  });

  test('should succeed with negative range', () => {
    expect(pageRangeToIndexes(-4, -1, 10)).toStrictEqual([6, 7, 8, 9]);
  });

  test('should succeed with negative range of 1 value', () => {
    expect(pageRangeToIndexes(-5, -5, 10)).toStrictEqual([5]);
  });
});

describe('extractText', () => {
  test('should extract text from a PDF', async () => {
    const { extractText } = await import('../src/lib/actions/extract-text');
    // pdf-parse bundles an old pdf.js that can't parse pdf-lib output,
    // so we use a known-good fixture file
    const pdfBuffer = loadFixturePdf();
    const ctx = createMockContext({ file: makeFileProperty(pdfBuffer) });

    const result = await extractText.run(ctx as any);

    expect(typeof result).toBe('string');
    expect((result as string).length).toBeGreaterThan(0);
  });
});

describe('pdfPageCount', () => {
  test('should return correct page count for single page', async () => {
    const { pdfPageCount } = await import('../src/lib/actions/pdf-page-count');
    const pdfBuffer = await createTestPdf(1);
    const ctx = createMockContext({ file: makeFileProperty(pdfBuffer) });

    const result = await pdfPageCount.run(ctx as any);
    expect(result).toBe(1);
  });

  test('should return correct page count for multiple pages', async () => {
    const { pdfPageCount } = await import('../src/lib/actions/pdf-page-count');
    const pdfBuffer = await createTestPdf(5);
    const ctx = createMockContext({ file: makeFileProperty(pdfBuffer) });

    const result = await pdfPageCount.run(ctx as any);
    expect(result).toBe(5);
  });
});

describe('textToPdf', () => {
  test('should create a valid PDF from text', async () => {
    const { textToPdf } = await import('../src/lib/actions/text-to-pdf');
    const ctx = createMockContext({ text: 'Hello PDF World' });

    await textToPdf.run(ctx as any);

    expect(ctx.writtenFiles).toHaveLength(1);
    expect(ctx.writtenFiles[0].fileName).toBe('text.pdf');

    const resultDoc = await PDFDocument.load(ctx.writtenFiles[0].data);
    expect(resultDoc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  test('should handle multi-line text', async () => {
    const { textToPdf } = await import('../src/lib/actions/text-to-pdf');
    const ctx = createMockContext({ text: 'Line 1\nLine 2\nLine 3' });

    await textToPdf.run(ctx as any);

    expect(ctx.writtenFiles).toHaveLength(1);
    const resultDoc = await PDFDocument.load(ctx.writtenFiles[0].data);
    expect(resultDoc.getPageCount()).toBeGreaterThanOrEqual(1);
  });
});

describe('extractPdfPages', () => {
  test('should extract a single page', async () => {
    const { extractPdfPages } = await import('../src/lib/actions/extract-pdf-pages');
    const pdfBuffer = await createTestPdf(3);
    const ctx = createMockContext({
      file: makeFileProperty(pdfBuffer),
      pageRanges: [{ startPage: 2, endPage: 2 }],
    });

    await extractPdfPages.run(ctx as any);

    expect(ctx.writtenFiles).toHaveLength(1);
    const resultDoc = await PDFDocument.load(ctx.writtenFiles[0].data);
    expect(resultDoc.getPageCount()).toBe(1);
  });

  test('should extract a range of pages', async () => {
    const { extractPdfPages } = await import('../src/lib/actions/extract-pdf-pages');
    const pdfBuffer = await createTestPdf(5);
    const ctx = createMockContext({
      file: makeFileProperty(pdfBuffer),
      pageRanges: [{ startPage: 2, endPage: 4 }],
    });

    await extractPdfPages.run(ctx as any);

    expect(ctx.writtenFiles).toHaveLength(1);
    const resultDoc = await PDFDocument.load(ctx.writtenFiles[0].data);
    expect(resultDoc.getPageCount()).toBe(3);
  });

  test('should extract multiple ranges', async () => {
    const { extractPdfPages } = await import('../src/lib/actions/extract-pdf-pages');
    const pdfBuffer = await createTestPdf(5);
    const ctx = createMockContext({
      file: makeFileProperty(pdfBuffer),
      pageRanges: [
        { startPage: 1, endPage: 1 },
        { startPage: 4, endPage: 5 },
      ],
    });

    await extractPdfPages.run(ctx as any);

    expect(ctx.writtenFiles).toHaveLength(1);
    const resultDoc = await PDFDocument.load(ctx.writtenFiles[0].data);
    expect(resultDoc.getPageCount()).toBe(3);
  });
});

describe('mergePdfs', () => {
  test('should merge two PDFs', async () => {
    const { mergePdfs } = await import('../src/lib/actions/merge-pdfs');
    const pdf1 = await createTestPdf(2);
    const pdf2 = await createTestPdf(3);

    const ctx = createMockContext({
      pdfFiles: [
        { file: makeFileProperty(pdf1) },
        { file: makeFileProperty(pdf2) },
      ],
      outputFileName: 'merged',
    });

    await mergePdfs.run(ctx as any);

    expect(ctx.writtenFiles).toHaveLength(1);
    expect(ctx.writtenFiles[0].fileName).toBe('merged.pdf');
    const resultDoc = await PDFDocument.load(ctx.writtenFiles[0].data);
    expect(resultDoc.getPageCount()).toBe(5);
  });

  test('should throw if fewer than 2 files', async () => {
    const { mergePdfs } = await import('../src/lib/actions/merge-pdfs');
    const pdf1 = await createTestPdf(1);

    const ctx = createMockContext({
      pdfFiles: [{ file: makeFileProperty(pdf1) }],
      outputFileName: 'merged',
    });

    await expect(mergePdfs.run(ctx as any)).rejects.toThrow();
  });
});

describe('addTextToPdf', () => {
  test('should add text to a specific page', async () => {
    const { addTextToPdf } = await import('../src/lib/actions/add-text-to-pdf');
    const pdfBuffer = await createTestPdf(2);

    const ctx = createMockContext({
      file: makeFileProperty(pdfBuffer),
      textItems: [
        {
          text: 'Stamped',
          applyToAllPages: false,
          pageNumber: 1,
          distanceFromLeft: 50,
          distanceFromTop: 100,
          font: StandardFonts.Helvetica,
          fontSize: 12,
          lineSpacing: 1.15,
        },
      ],
    });

    await addTextToPdf.run(ctx as any);

    expect(ctx.writtenFiles).toHaveLength(1);
    expect(ctx.writtenFiles[0].fileName).toContain('stamped_');
    const resultDoc = await PDFDocument.load(ctx.writtenFiles[0].data);
    expect(resultDoc.getPageCount()).toBe(2);
  });

  test('should add text to all pages', async () => {
    const { addTextToPdf } = await import('../src/lib/actions/add-text-to-pdf');
    const pdfBuffer = await createTestPdf(3);

    const ctx = createMockContext({
      file: makeFileProperty(pdfBuffer),
      textItems: [
        {
          text: 'Footer',
          applyToAllPages: true,
          distanceFromLeft: 50,
          distanceFromTop: 800,
          font: StandardFonts.Helvetica,
          fontSize: 10,
          lineSpacing: 1.15,
        },
      ],
    });

    await addTextToPdf.run(ctx as any);

    expect(ctx.writtenFiles).toHaveLength(1);
    const resultDoc = await PDFDocument.load(ctx.writtenFiles[0].data);
    expect(resultDoc.getPageCount()).toBe(3);
  });

  test('should throw on invalid page number', async () => {
    const { addTextToPdf } = await import('../src/lib/actions/add-text-to-pdf');
    const pdfBuffer = await createTestPdf(1);

    const ctx = createMockContext({
      file: makeFileProperty(pdfBuffer),
      textItems: [
        {
          text: 'Out of bounds',
          applyToAllPages: false,
          pageNumber: 5,
          distanceFromLeft: 50,
          distanceFromTop: 100,
          font: StandardFonts.Helvetica,
          fontSize: 12,
        },
      ],
    });

    await expect(addTextToPdf.run(ctx as any)).rejects.toThrow();
  });
});

describe('convertToImage', () => {
  test('should reject files exceeding 16MB', async () => {
    const { convertToImage } = await import('../src/lib/actions/convert-to-image');
    const largeBuffer = Buffer.alloc(17 * 1024 * 1024);
    const ctx = createMockContext({
      file: makeFileProperty(largeBuffer),
      imageOutputType: 'multiple',
    });

    await expect(convertToImage.run(ctx as any)).rejects.toThrow('exceeds the limit');
  });
});
