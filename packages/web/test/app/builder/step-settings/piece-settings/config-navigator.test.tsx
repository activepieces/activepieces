/**
 * @vitest-environment jsdom
 *
 * ConfigNavigator is the index + Back/Next shell for piece configuration. These
 * tests render it against a real react-hook-form so the requirement that matters
 * most — moving between sections must never reset entered data — is exercised
 * for real rather than asserted structurally.
 *
 * renderSection is stubbed because it is an injected prop; the real piece
 * property renderer belongs to GenericPropertiesForm, not to this component.
 *
 * Uses raw react-dom + React's act, as @testing-library/react is not a
 * dependency of this package.
 */
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

// eslint-disable-next-line import/first
import { ConfigNavigator } from '@/app/builder/step-settings/piece-settings/config-navigator';
// eslint-disable-next-line import/first
import { type ConfigSection } from '@/app/builder/step-settings/piece-settings/config-sections';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const sections: ConfigSection[] = [
  {
    key: 'connection',
    kind: 'connection',
    label: 'Connection',
    description: 'Connect your account',
    propNames: ['auth'],
  },
  {
    key: 'group-payment',
    kind: 'properties',
    label: 'Payment Details',
    propNames: ['description', 'amount'],
  },
  {
    key: 'group-options',
    kind: 'properties',
    label: 'Options',
    propNames: ['locale'],
  },
];

const requiredNamesByKey = {
  connection: ['auth'],
  'group-payment': ['description'],
  'group-options': [],
};

type HarnessValues = { settings: { input: Record<string, unknown> } };

function Harness() {
  const form = useForm<HarnessValues>({
    mode: 'all',
    defaultValues: { settings: { input: {} } },
  });
  return (
    <FormProvider {...form}>
      <ConfigNavigator
        sections={sections}
        requiredNamesByKey={requiredNamesByKey}
        prefixValue="settings.input"
        renderSection={(section) => (
          <input
            data-testid={section.key}
            onChange={(event) =>
              form.setValue(
                `settings.input.${section.propNames[0]}`,
                event.target.value,
              )
            }
          />
        )}
      />
    </FormProvider>
  );
}

let container: HTMLDivElement | undefined;
let root: Root | undefined;

function render() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(<Harness />);
  });
}

function visibleSectionKeys(): string[] {
  return Array.from(
    container?.querySelectorAll<HTMLElement>('[data-testid]') ?? [],
  )
    .filter((element) => element.offsetParent !== null || !isHidden(element))
    .map((element) => element.dataset['testid'] ?? '');
}

function isHidden(element: HTMLElement): boolean {
  let node: HTMLElement | null = element;
  while (node) {
    if (node.hasAttribute('hidden')) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

function mountedSectionKeys(): string[] {
  return Array.from(
    container?.querySelectorAll<HTMLElement>('[data-testid]') ?? [],
  ).map((element) => element.dataset['testid'] ?? '');
}

function indexButton(label: string): HTMLElement {
  const found = Array.from(
    container?.querySelectorAll<HTMLElement>('nav button') ?? [],
  ).find((button) => button.textContent?.includes(label));
  if (!found) {
    throw new Error(`no index entry for ${label}`);
  }
  return found;
}

function footerButton(label: string): HTMLButtonElement {
  const found = Array.from(
    container?.querySelectorAll<HTMLButtonElement>('footer button') ?? [],
  ).find((button) => button.textContent?.includes(label));
  if (!found) {
    throw new Error(`no footer button ${label}`);
  }
  return found;
}

function fieldOf(key: string): HTMLInputElement {
  const found = container?.querySelector<HTMLInputElement>(
    `[data-testid="${key}"]`,
  );
  if (!found) {
    throw new Error(`no field for ${key}`);
  }
  return found;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = undefined;
  root = undefined;
});

describe('ConfigNavigator', () => {
  it('lists every section in the index', () => {
    render();
    const labels = Array.from(
      container?.querySelectorAll<HTMLElement>('nav button') ?? [],
    ).map((button) => button.textContent);
    expect(labels).toHaveLength(3);
    expect(labels[0]).toContain('Connection');
    expect(labels[1]).toContain('Payment Details');
    expect(labels[2]).toContain('Options');
  });

  it('keeps every section mounted so entered data cannot be lost', () => {
    render();
    expect(mountedSectionKeys()).toEqual([
      'connection',
      'group-payment',
      'group-options',
    ]);
    expect(visibleSectionKeys()).toEqual(['connection']);
  });

  it('jumps straight to any section from the index in one click', () => {
    render();
    act(() => {
      indexButton('Options').click();
    });
    expect(visibleSectionKeys()).toEqual(['group-options']);
  });

  it('moves forward and back with Next and Back', () => {
    render();
    act(() => {
      footerButton('Next').click();
    });
    expect(visibleSectionKeys()).toEqual(['group-payment']);

    act(() => {
      footerButton('Back').click();
    });
    expect(visibleSectionKeys()).toEqual(['connection']);
  });

  it('disables Back on the first section and drops Next on the last', () => {
    render();
    expect(footerButton('Back').disabled).toBe(true);

    act(() => {
      indexButton('Options').click();
    });
    expect(() => footerButton('Next')).toThrow();
  });

  it('preserves a typed value after navigating away and back', () => {
    render();
    act(() => {
      indexButton('Payment Details').click();
    });

    const field = fieldOf('group-payment');
    act(() => {
      field.value = 'Invoice 42';
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });

    act(() => {
      indexButton('Options').click();
    });
    act(() => {
      indexButton('Payment Details').click();
    });

    expect(fieldOf('group-payment').value).toBe('Invoice 42');
  });
});
