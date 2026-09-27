/**
 * @vitest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  primaryColor: '#6e41e2',
  brandColor: '#6e41e2',
  customAppearanceEnabled: true,
  update: vi.fn(async (_formdata: FormData, _platformId: string) => undefined),
  toastSuccess: vi.fn(),
  saving: Promise.resolve() as Promise<unknown>,
}));

vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: { success: state.toastSuccess },
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: (options: any) => ({
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
    useWebsiteBranding: () => ({
      colors: { primary: { default: state.brandColor } },
    }),
  },
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, type, disabled, onClick }: any) => (
    <button type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => {
  const Input = React.forwardRef<HTMLInputElement, any>(
    ({ defaultFileName: _defaultFileName, ...props }, ref) => (
      <input ref={ref} {...props} />
    ),
  );
  Input.displayName = 'Input';
  return { Input };
});

vi.mock('@/components/custom/color-picker', () => ({
  ColorPicker: ({ value, onChange }: any) => (
    <input
      aria-label="colour"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  ),
}));

vi.mock('@/app/routes/platform/setup/general/brand-color-preview', () => ({
  BrandColorPreview: () => null,
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
    state.saving = Promise.resolve();
    state.customAppearanceEnabled = true;
    state.primaryColor = '#6e41e2';
    state.brandColor = '#6e41e2';
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
    const cancel = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Cancel',
    );
    if (!cancel) throw new Error('no cancel button');
    await act(async () => {
      cancel.click();
    });
    expect(accent()).toBe('#6e41e2');
    expect(state.update).not.toHaveBeenCalled();
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
