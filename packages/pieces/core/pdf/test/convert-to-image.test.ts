import { basename } from 'path';
import Jimp from 'jimp';

const renderedFiles = vi.hoisted(() => new Map<string, Buffer>());

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      mkdir: async () => undefined,
      writeFile: async () => undefined,
      readdir: async () => [...renderedFiles.keys()],
      readFile: async (filePath: string) => renderedFiles.get(basename(filePath)),
      unlink: async () => undefined,
      rm: async () => undefined,
    },
  };
});

vi.mock('child_process', () => ({
  exec: (
    command: string,
    callback: (error: Error | null, result: { stdout: string; stderr: string }) => void
  ) => {
    const stdout = command.startsWith('command -v') ? '/usr/bin/pdftoppm\n' : '';
    callback(null, { stdout, stderr: '' });
  },
}));

const PAGE_SIZE = 4;
const PAGE_COLORS = [0xff0000ff, 0x00ff00ff, 0x0000ffff];

async function makePagePng(color: number): Promise<Buffer> {
  const image = new Jimp(PAGE_SIZE, PAGE_SIZE, color);
  return image.getBufferAsync(Jimp.MIME_PNG);
}

async function seedRenderedPagesOutOfOrder(): Promise<Buffer[]> {
  const pages = await Promise.all(PAGE_COLORS.map((color) => makePagePng(color)));
  renderedFiles.clear();
  renderedFiles.set('output-3.png', pages[2]);
  renderedFiles.set('output-1.png', pages[0]);
  renderedFiles.set('output-2.png', pages[1]);
  return pages;
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
    writtenFiles,
  };
}

describe('convertToImage page order', () => {
  test('writes one image per page in page order when the directory listing is unsorted', async () => {
    const { convertToImage } = await import('../src/lib/actions/convert-to-image');
    const pages = await seedRenderedPagesOutOfOrder();
    const ctx = createMockContext({
      file: { filename: 'test.pdf', extension: 'pdf', data: Buffer.from('pdf') },
      imageOutputType: 'multiple',
    });

    const result = await convertToImage.run(ctx as any);

    expect(result).toStrictEqual({
      images: [
        'file:///converted_image_page_1.png',
        'file:///converted_image_page_2.png',
        'file:///converted_image_page_3.png',
      ],
    });
    expect(ctx.writtenFiles.map((file) => file.data)).toStrictEqual(pages);
  });

  test('stacks pages top to bottom in page order in the combined image', async () => {
    const { convertToImage } = await import('../src/lib/actions/convert-to-image');
    await seedRenderedPagesOutOfOrder();
    const ctx = createMockContext({
      file: { filename: 'test.pdf', extension: 'pdf', data: Buffer.from('pdf') },
      imageOutputType: 'single',
    });

    const result = await convertToImage.run(ctx as any);

    expect(result).toStrictEqual({ image: 'file:///converted_image.png' });
    const combined = await Jimp.read(ctx.writtenFiles[0].data);
    expect(combined.getHeight()).toBe(PAGE_SIZE * PAGE_COLORS.length);
    PAGE_COLORS.forEach((color, pageIndex) => {
      expect(combined.getPixelColor(0, pageIndex * PAGE_SIZE)).toBe(color);
    });
  });
});
