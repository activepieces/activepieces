import { slugifyAction } from '../src/lib/actions/slugify';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('slugify action', () => {
  test('slugifies a simple string', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'Hello World',
      },
    });
    const result = await slugifyAction.run(ctx);
    expect(result).toBe('Hello-World');
  });

  test('handles special characters', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'Hello & World!',
      },
    });
    const result = await slugifyAction.run(ctx);
    expect(result).toBe('Hello-and-World!');
  });

  test('handles multiple spaces', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'hello   world',
      },
    });
    const result = await slugifyAction.run(ctx);
    expect(result).toBe('hello-world');
  });
});
