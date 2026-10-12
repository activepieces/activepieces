/// <reference types="vitest/globals" />

const { onEnableMock, onDisableMock } = vi.hoisted(() => ({
  onEnableMock: vi.fn(),
  onDisableMock: vi.fn(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    pollingHelper: {
      ...actual.pollingHelper,
      onEnable: onEnableMock,
      onDisable: onDisableMock,
    },
  };
});

const { newFile } = await import('../src/lib/triggers/new-file');
const { newFolder } = await import('../src/lib/triggers/new-folder');

describe('Google Drive triggers republish context forwarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('newFile trigger', () => {
    it('forwards full context including isRepublish to pollingHelper.onEnable', async () => {
      const context = {
        auth: { access_token: 'test' } as any,
        store: {} as any,
        propsValue: {},
        isRepublish: true,
      } as any;

      await newFile.onEnable(context);
      expect(onEnableMock).toHaveBeenCalledWith(expect.anything(), context);
    });

    it('forwards full context to pollingHelper.onDisable', async () => {
      const context = {
        auth: { access_token: 'test' } as any,
        store: {} as any,
        propsValue: {},
      } as any;

      await newFile.onDisable(context);
      expect(onDisableMock).toHaveBeenCalledWith(expect.anything(), context);
    });
  });

  describe('newFolder trigger', () => {
    it('forwards full context including isRepublish to pollingHelper.onEnable', async () => {
      const context = {
        auth: { access_token: 'test' } as any,
        store: {} as any,
        propsValue: {},
        isRepublish: true,
      } as any;

      await newFolder.onEnable(context);
      expect(onEnableMock).toHaveBeenCalledWith(expect.anything(), context);
    });

    it('forwards full context to pollingHelper.onDisable', async () => {
      const context = {
        auth: { access_token: 'test' } as any,
        store: {} as any,
        propsValue: {},
      } as any;

      await newFolder.onDisable(context);
      expect(onDisableMock).toHaveBeenCalledWith(expect.anything(), context);
    });
  });
});
