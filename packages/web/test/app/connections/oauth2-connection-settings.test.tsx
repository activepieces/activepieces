/**
 * @vitest-environment jsdom
 */
import { PieceAuth } from '@activepieces/pieces-framework';
import {
  AppConnectionType,
  OAuth2GrantType,
  PackageType,
  PieceType,
} from '@activepieces/shared';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: undefined }) },
}));
vi.mock('@/features/connections', () => ({
  oauth2Utils: { resolveRedirectUrl: () => 'https://redirect.example' },
}));
vi.mock('@/features/connections/api/app-connections', () => ({
  appConnectionsApi: {},
}));
vi.mock('@/lib/api', () => ({ api: {} }));
vi.mock('@/app/builder/piece-properties/generic-properties-form', () => ({
  GenericPropertiesForm: () => null,
}));

import { OAuth2ConnectionSettings } from '@/app/connections/oauth2-connection-settings';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

Element.prototype.scrollIntoView = () => undefined;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as never;
if (!globalThis.PointerEvent) {
  globalThis.PointerEvent = MouseEvent as never;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
];

const AUTH = PieceAuth.OAuth2({
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: SCOPES,
});

const PIECE = {
  name: '@activepieces/piece-gmail',
  displayName: 'Gmail',
  logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
  description: '',
  authors: [],
  version: '0.1.0',
  actions: 0,
  triggers: 0,
  contextInfo: undefined,
  projectUsage: 0,
  pieceType: PieceType.OFFICIAL,
  packageType: PackageType.REGISTRY,
};

function Harness() {
  const form = useForm({
    defaultValues: {
      request: {
        value: { client_id: 'id', client_secret: 'secret', scope: '' },
      },
    },
  });
  return (
    <FormProvider {...form}>
      <OAuth2ConnectionSettings
        authProperty={AUTH}
        oauth2App={{
          oauth2Type: AppConnectionType.CLOUD_OAUTH2,
          clientId: 'client-id',
        }}
        piece={PIECE}
        grantType={OAuth2GrantType.CLIENT_CREDENTIALS}
      />
    </FormProvider>
  );
}

const click = (element: Element | null | undefined) => {
  act(() => {
    element?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

const openTrigger = () =>
  click(
    Array.from(document.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Select permissions'),
    ),
  );

const openPicker = () => {
  act(() => {
    document
      .querySelector<HTMLElement>('[role="button"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  openTrigger();
};

const closePicker = () => {
  act(() => {
    document
      .querySelector('[cmdk-input]')
      ?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
  });
};

const typeSearch = (value: string) => {
  const input = document.querySelector<HTMLInputElement>('[cmdk-input]');
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;
  act(() => {
    setter?.call(input, value);
    input?.dispatchEvent(new Event('input', { bubbles: true }));
  });
  return input;
};

const listedItems = () =>
  Array.from(document.querySelectorAll('[cmdk-item]')).map(
    (item) => item.textContent,
  );

describe('OAuth2ConnectionSettings scope search', () => {
  let root: Root | undefined;
  let unhandled: unknown[] = [];
  const collect = (error: unknown) => unhandled.push(error);

  beforeEach(() => {
    unhandled = [];
    process.on('uncaughtException', collect);
  });

  afterEach(() => {
    act(() => root?.unmount());
    process.off('uncaughtException', collect);
    document.body.innerHTML = '';
    expect(unhandled).toEqual([]);
  });

  const mountAndOpen = () => {
    act(() => {
      root = createRoot(
        document.body.appendChild(document.createElement('div')),
      );
      root.render(<Harness />);
    });
    openPicker();
  };

  it('keeps the typed keyword and filters the scope list', () => {
    mountAndOpen();
    expect(listedItems()).toEqual(['Select All', ...SCOPES]);

    const input = typeSearch('modify');

    expect(input?.value).toBe('modify');
    expect(listedItems()).toEqual([
      'https://www.googleapis.com/auth/gmail.modify',
    ]);

    typeSearch('');
    expect(listedItems()).toEqual(['Select All', ...SCOPES]);
  });

  it('shows the empty state when no scope matches', () => {
    mountAndOpen();

    typeSearch('zzz');

    expect(listedItems()).toEqual([]);
    expect(document.querySelector('[cmdk-empty]')?.textContent).toBe(
      'No results found.',
    );
  });

  it('resets the search when the picker is closed and reopened', () => {
    mountAndOpen();
    typeSearch('modify');

    closePicker();
    expect(document.querySelector('[cmdk-item]')).toBeNull();
    openTrigger();

    expect(
      document.querySelector<HTMLInputElement>('[cmdk-input]')?.value,
    ).toBe('');
    expect(listedItems()).toEqual(['Select All', ...SCOPES]);
  });
});
