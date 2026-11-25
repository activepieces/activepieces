/**
 * @vitest-environment jsdom
 */
import { Property } from '@activepieces/pieces-framework';
import { ApEdition } from '@activepieces/shared';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GenericPropertiesForm } from '@/app/builder/piece-properties/generic-properties-form';

vi.mock('i18next', () => ({ t: (key: string) => key }));

let edition: ApEdition = ApEdition.COMMUNITY;
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: edition }) },
}));

const props = {
  setupNote: Property.MarkDown({
    value: 'Self-hosted setup note',
    selfHostedOnly: true,
  }),
  channelNote: Property.MarkDown({ value: 'Channel note' }),
};

const Harness = () => {
  const form = useForm();
  return (
    <FormProvider {...form}>
      <GenericPropertiesForm
        props={props}
        propertySettings={null}
        prefixValue="settings.input"
        useMentionTextInput={false}
        dynamicPropsInfo={null}
      />
    </FormProvider>
  );
};

describe('GenericPropertiesForm self-hosted-only markdown', () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
  });

  const renderFor = (current: ApEdition) => {
    edition = current;
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      root = createRoot(container!);
      root.render(<Harness />);
    });
    return container.textContent ?? '';
  };

  it('hides the note on Cloud and keeps the other markdown', () => {
    const text = renderFor(ApEdition.CLOUD);
    expect(text.includes('Self-hosted setup note')).toBe(false);
    expect(text.includes('Channel note')).toBe(true);
  });

  it.each([ApEdition.COMMUNITY, ApEdition.ENTERPRISE])(
    'shows the note on %s',
    (current) => {
      const text = renderFor(current);
      expect(text.includes('Self-hosted setup note')).toBe(true);
    },
  );
});
