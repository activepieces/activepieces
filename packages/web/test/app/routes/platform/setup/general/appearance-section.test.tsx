/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  primaryColor: '#6e41e2',
  brandColor: '#6e41e2',
  themeColors: null as Record<string, unknown> | null,
  statusColors: {} as Record<string, string> | undefined,
  customAppearanceEnabled: true,
  update: vi.fn(async (_formdata: FormData, _platformId: string) => undefined),
  toastSuccess: vi.fn(),
  invalidate: vi.fn(async (_filters: unknown) => undefined),
  saving: Promise.resolve() as Promise<unknown>,
}));

vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: { success: state.toastSuccess },
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: state.invalidate }),
  useMutation: (options: MutationOptions) => ({
    mutate: () => {
      state.saving = options.mutationFn().then(
        (data: unknown) => options.onSuccess(data),
        (error: unknown) => options.onError(error),
      );
    },
    isPending: false,
  }),
}));

vi.mock('@/api/platforms-api', () => ({
  platformApi: {
    updateWithFormData: (formdata: FormData, platformId: string) =>
      state.update(formdata, platformId),
  },
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        name: 'Northwind',
        primaryColor: state.primaryColor,
        themeColors: state.themeColors,
        fullLogoUrl: '',
        logoIconUrl: '',
        favIconUrl: '',
        plan: { customAppearanceEnabled: state.customAppearanceEnabled },
      },
    }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    queryKey: ['flags'],
    useWebsiteBranding: () => ({
      colors: {
        avatar: '#515151',
        'blue-link': '#1890ff',
        danger: '#f94949',
        selection: '#e2dbfa',
        primary: {
          default: state.brandColor,
          dark: '#5a2fd0',
          light: '#e2d9fb',
          medium: '#8b6de8',
        },
        warn: { default: '#f78a3b', light: '#fff6e4', dark: '#cc8805' },
        success: { default: '#14ae5c', light: '#3cad71' },
      },
      statusColors: state.statusColors,
    }),
  },
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, type, disabled, onClick }: ButtonMockProps) => (
    <button type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => {
  const Input = React.forwardRef<HTMLInputElement, InputMockProps>(
    ({ defaultFileName: _defaultFileName, ...props }, ref) => (
      <input ref={ref} {...props} />
    ),
  );
  Input.displayName = 'Input';
  return { Input, inputClass: '' };
});

vi.mock('@/components/custom/color-picker', () => ({
  ColorPicker: ({ value, onChange }: ColorPickerMockProps) => (
    <input
      aria-label="colour"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  ),
}));

vi.mock('@/app/routes/platform/setup/general/color-preview', () => ({
  ColorPreview: () => null,
}));

vi.mock('@/app/components/feature-banner', () => ({
  FeatureBanner: () => null,
}));

import { AppearanceSection } from '@/app/routes/platform/setup/general/appearance-section';

let container: HTMLDivElement;
let root: Root;

async function render() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<AppearanceSection />);
  });
  await act(async () => {
    await Promise.resolve();
  });
}

function setInputValue({
  input,
  value,
}: {
  input: HTMLInputElement;
  value: string;
}) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

async function type({ selector, value }: { selector: string; value: string }) {
  const input = container.querySelector<HTMLInputElement>(selector);
  if (!input) throw new Error(`no input ${selector}`);
  await act(async () => {
    setInputValue({ input, value });
  });
}

async function save() {
  const button = container.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  );
  if (!button) throw new Error('no save button');
  expect(button.disabled).toBe(false);
  await act(async () => {
    button.click();
  });
  await act(async () => {
    await state.saving;
  });
}

function colourInputs(): HTMLInputElement[] {
  return [
    ...container.querySelectorAll<HTMLInputElement>(
      'input[aria-label="colour"]',
    ),
  ];
}

function buttonNamed({ name }: { name: string }): HTMLButtonElement {
  const button = [...container.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === name,
  );
  if (!button) throw new Error(`no ${name} button`);
  return button;
}

function hasUnsavedNotice(): boolean {
  return container.textContent?.includes('You have unsaved changes') ?? false;
}

function submitButton(): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  );
  if (!button) throw new Error('no save button');
  return button;
}

function resetButtons(): HTMLButtonElement[] {
  return [...container.querySelectorAll('button')].filter(
    (button) => button.textContent === 'Reset',
  );
}

function sentThemeColors(): unknown {
  return JSON.parse(sentFields().themeColors as string);
}

function sentFields(): Record<string, FormDataEntryValue> {
  const formdata = state.update.mock.calls[0]?.[0];
  if (!formdata) throw new Error('nothing was saved');
  return Object.fromEntries(formdata.entries());
}

describe('AppearanceSection', () => {
  beforeEach(() => {
    state.update.mockReset();
    state.update.mockResolvedValue(undefined);
    state.toastSuccess.mockClear();
    state.invalidate.mockClear();
    state.saving = Promise.resolve();
    state.customAppearanceEnabled = true;
    state.primaryColor = '#6e41e2';
    state.brandColor = '#6e41e2';
    state.themeColors = null;
    state.statusColors = {};
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('saves a name change on a platform with a legacy colour, without sending the colour', async () => {
    state.primaryColor = 'red';
    state.brandColor = '#ff0000';
    await render();
    expect(
      container.querySelector<HTMLInputElement>('input[aria-label="colour"]')
        ?.value,
    ).toBe('#ff0000');
    await type({ selector: '#name', value: 'Contoso' });
    await save();
    const fields = sentFields();
    expect(fields.name).toBe('Contoso');
    expect(fields).not.toHaveProperty('primaryColor');
  });

  it('sends the colour when the admin changes it', async () => {
    await render();
    await type({ selector: 'input[aria-label="colour"]', value: '#0ea5e9' });
    await save();
    expect(sentFields().primaryColor).toBe('#0ea5e9');
  });

  it('previews a picked colour on the page and puts the saved one back on cancel', async () => {
    await render();
    await type({ selector: 'input[aria-label="colour"]', value: '#0ea5e9' });
    const accent = () =>
      document.documentElement.style.getPropertyValue('--accent-9');
    expect(accent()).toBe('#0ea5e9');
    await act(async () => {
      buttonNamed({ name: 'Cancel' }).click();
    });
    expect(accent()).toBe('#6e41e2');
    expect(state.update).not.toHaveBeenCalled();
  });

  it('shows every colour on its default with reset disabled, and no toggle', async () => {
    await render();
    expect(colourInputs().map((input) => input.value)).toEqual([
      '#6e41e2',
      '#c11825',
      '#f9ad28',
      '#33ac5a',
    ]);
    expect(container.querySelector('input[type="checkbox"]')).toBeNull();
    const resets = resetButtons();
    expect(resets).toHaveLength(4);
    expect(resets.every((button) => button.disabled)).toBe(true);
  });

  it('resets the primary colour to the stock brand colour', async () => {
    state.primaryColor = '#0ea5e9';
    state.brandColor = '#0ea5e9';
    await render();
    await act(async () => {
      resetButtons()[0].click();
    });
    await save();
    expect(sentFields().primaryColor).toBe('#6e41e2');
  });

  it('saves a chosen status colour under status and keeps everything else stored', async () => {
    state.themeColors = {
      avatar: '#515151',
      danger: '#f94949',
      primary: { dark: '#5a2fd0' },
    };
    await render();
    await act(async () => {
      setInputValue({ input: colourInputs()[1], value: '#f94949' });
    });
    await save();
    expect(sentThemeColors()).toStrictEqual({
      avatar: '#515151',
      danger: '#f94949',
      primary: { dark: '#5a2fd0' },
      status: { danger: '#f94949' },
    });
  });

  it('starts from the stored status colours, not the branding flag', async () => {
    state.themeColors = { status: { warning: '#eab308' } };
    state.statusColors = undefined;
    await render();
    expect(colourInputs()[2].value).toBe('#eab308');
    await type({ selector: '#name', value: 'Contoso' });
    await save();
    expect(sentThemeColors()).toStrictEqual({
      status: { warning: '#eab308' },
    });
  });

  it('resets a status colour back to the standard palette', async () => {
    state.themeColors = { status: { danger: '#b91c1c', success: '#16a34a' } };
    await render();
    await act(async () => {
      resetButtons()[1].click();
    });
    await save();
    expect(sentThemeColors()).toStrictEqual({
      status: { success: '#16a34a' },
    });
  });

  it('lets a saved seed be reset even when it matches the stock colour', async () => {
    state.themeColors = { status: { danger: '#c11825' } };
    await render();
    expect(resetButtons()[1].disabled).toBe(false);
    await act(async () => {
      resetButtons()[1].click();
    });
    await save();
    expect(sentThemeColors()).toStrictEqual({});
  });

  it('leaves the fields the old form saved untouched and unused', async () => {
    state.themeColors = { danger: '#f94949', warn: { default: '#f78a3b' } };
    await render();
    expect(
      resetButtons()
        .slice(1)
        .every((button) => button.disabled),
    ).toBe(true);
    await type({ selector: '#name', value: 'Contoso' });
    await save();
    expect(sentThemeColors()).toStrictEqual({
      danger: '#f94949',
      warn: { default: '#f78a3b' },
    });
  });

  it('previews a status colour on the page and removes it on cancel', async () => {
    await render();
    await act(async () => {
      setInputValue({ input: colourInputs()[3], value: '#16a34a' });
    });
    const seed = () =>
      document.documentElement.style.getPropertyValue('--success-seed');
    expect(seed()).toBe('#16a34a');
    await act(async () => {
      buttonNamed({ name: 'Cancel' }).click();
    });
    expect(seed()).toBe('');
    expect(state.update).not.toHaveBeenCalled();
  });

  it('disables saving and says nothing while there are no changes', async () => {
    await render();
    expect(submitButton().disabled).toBe(true);
    expect(buttonNamed({ name: 'Cancel' }).disabled).toBe(true);
    expect(hasUnsavedNotice()).toBe(false);
  });

  it('says there are unsaved changes once something changes, and clears it on cancel', async () => {
    await render();
    await act(async () => {
      setInputValue({ input: colourInputs()[2], value: '#ea580c' });
    });
    expect(hasUnsavedNotice()).toBe(true);
    expect(submitButton().disabled).toBe(false);
    await act(async () => {
      buttonNamed({ name: 'Cancel' }).click();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(hasUnsavedNotice()).toBe(false);
    expect(submitButton().disabled).toBe(true);
  });

  it('refreshes the platform and branding after saving instead of reloading the page', async () => {
    await render();
    await type({ selector: '#name', value: 'Contoso' });
    await save();
    expect(state.invalidate.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: ['platform', 'platform-1'] },
      { queryKey: ['flags'] },
    ]);
    expect(state.toastSuccess).toHaveBeenCalled();
  });

  it('lets the admin retry after a failed save', async () => {
    state.update.mockRejectedValueOnce(new Error('network down'));
    await render();
    await type({ selector: '#name', value: 'Contoso' });
    await save();
    expect(submitButton().disabled).toBe(false);
    await save();
    expect(state.update).toHaveBeenCalledTimes(2);
    expect(state.toastSuccess).toHaveBeenCalled();
  });

  it('reports a failed save in place instead of confirming it', async () => {
    state.update.mockRejectedValueOnce(new Error('network down'));
    await render();
    await type({ selector: '#name', value: 'Contoso' });
    await save();
    expect(state.toastSuccess).not.toHaveBeenCalled();
    expect(
      container.textContent?.includes(
        'Failed to save changes. Please try again.',
      ),
    ).toBe(true);
  });
});

type MutationOptions = {
  mutationFn: () => Promise<unknown>;
  onSuccess: (data: unknown) => void;
  onError: (error: unknown) => void;
};

type ButtonMockProps = {
  children?: React.ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
};

type InputMockProps = React.InputHTMLAttributes<HTMLInputElement> & {
  defaultFileName?: string;
};

type ColorPickerMockProps = {
  value: string;
  onChange: (value: string) => void;
};
