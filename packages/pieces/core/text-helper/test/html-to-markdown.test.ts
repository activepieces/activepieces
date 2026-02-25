import { htmlToMarkdown } from '../src/lib/actions/html-to-markdown';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('htmlToMarkdown action', () => {
  test('converts basic HTML to markdown', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        html: '<strong>bold</strong> and <em>italic</em>',
      },
    });
    const result = await htmlToMarkdown.run(ctx);
    expect(result).toContain('**bold**');
    expect(result).toContain('_italic_');
  });

  test('converts headers', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        html: '<h1>Title</h1>',
      },
    });
    const result = await htmlToMarkdown.run(ctx);
    // Turndown uses setext-style headers (Title\n=====) for h1/h2
    expect(result).toContain('Title');
    expect(result).toContain('=====');
  });

  test('converts links', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        html: '<a href="https://example.com">example</a>',
      },
    });
    const result = await htmlToMarkdown.run(ctx);
    expect(result).toContain('[example](https://example.com)');
  });

  test('strips script tags', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        html: '<p>Hello</p><script>alert("xss")</script>',
      },
    });
    const result = await htmlToMarkdown.run(ctx);
    expect(result).not.toContain('script');
    expect(result).not.toContain('alert');
    expect(result).toContain('Hello');
  });
});
