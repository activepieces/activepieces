import { stripHtmlContent } from '../src/lib/actions/strip-html';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('stripHtml action', () => {
  test('removes HTML tags', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        html: '<p>Hello <strong>world</strong></p>',
      },
    });
    const result = await stripHtmlContent.run(ctx);
    expect(result).toBe('Hello world');
  });

  test('handles nested tags', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        html: '<div><p>Hello <em><strong>world</strong></em></p></div>',
      },
    });
    const result = await stripHtmlContent.run(ctx);
    expect(result).toBe('Hello world');
  });

  test('handles plain text with no tags', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        html: 'just plain text',
      },
    });
    const result = await stripHtmlContent.run(ctx);
    expect(result).toBe('just plain text');
  });
});
