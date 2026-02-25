import { markdownToHTML } from '../src/lib/actions/markdown-to-html';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('markdownToHTML action', () => {
  test('converts basic markdown to HTML', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        markdown: '**bold** and *italic*',
        flavor: 'github',
        headerLevelStart: 1,
        tables: true,
        noHeaderId: true,
        simpleLineBreaks: false,
        openLinksInNewWindow: false,
      },
    });
    const result = await markdownToHTML.run(ctx);
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });

  test('converts headers', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        markdown: '# Title',
        flavor: 'github',
        headerLevelStart: 1,
        tables: true,
        noHeaderId: true,
        simpleLineBreaks: false,
        openLinksInNewWindow: false,
      },
    });
    const result = await markdownToHTML.run(ctx);
    expect(result).toContain('<h1');
    expect(result).toContain('Title');
  });

  test('respects headerLevelStart', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        markdown: '# Title',
        flavor: 'github',
        headerLevelStart: 3,
        tables: true,
        noHeaderId: true,
        simpleLineBreaks: false,
        openLinksInNewWindow: false,
      },
    });
    const result = await markdownToHTML.run(ctx);
    expect(result).toContain('<h3');
  });

  test('converts links', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        markdown: '[example](https://example.com)',
        flavor: 'github',
        headerLevelStart: 1,
        tables: true,
        noHeaderId: true,
        simpleLineBreaks: false,
        openLinksInNewWindow: false,
      },
    });
    const result = await markdownToHTML.run(ctx);
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('example');
  });

  test('opens links in new window when enabled', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        markdown: '[example](https://example.com)',
        flavor: 'github',
        headerLevelStart: 1,
        tables: true,
        noHeaderId: true,
        simpleLineBreaks: false,
        openLinksInNewWindow: true,
      },
    });
    const result = await markdownToHTML.run(ctx);
    expect(result).toContain('target="_blank"');
  });
});
