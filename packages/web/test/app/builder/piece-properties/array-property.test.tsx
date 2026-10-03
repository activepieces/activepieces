/**
 * @vitest-environment jsdom
 */
import { Property } from '@activepieces/pieces-framework';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  FormProvider,
  useForm,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/app/builder/piece-properties/generic-properties-form', () => ({
  GenericPropertiesForm: () => null,
}));

vi.mock('@/app/builder/piece-properties/text-input-with-mentions', () => ({
  TextInputWithMentions: () => null,
}));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { ArrayPieceProperty } from '@/app/builder/piece-properties/array-property';

const arrayProperty = Property.Array({
  displayName: 'Items',
  required: false,
  properties: {
    dataType: Property.StaticDropdown({
      displayName: 'Data Type',
      required: true,
      defaultValue: 'text',
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Number', value: 'number' },
        ],
      },
    }),
    pageNumber: Property.Number({
      displayName: 'Page Number',
      required: false,
      defaultValue: 1,
    }),
    bold: Property.Checkbox({
      displayName: 'Bold',
      required: false,
      defaultValue: true,
    }),
    tags: Property.StaticMultiSelectDropdown({
      displayName: 'Tags',
      required: false,
      defaultValue: ['a'],
      options: { options: [{ label: 'A', value: 'a' }] },
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      required: false,
    }),
    choice: Property.StaticDropdown({
      displayName: 'Choice',
      required: false,
      options: { options: [{ label: 'A', value: 'a' }] },
    }),
  },
});

let formInstance: UseFormReturn | undefined;

const Harness = ({ initialItems }: { initialItems?: unknown[] }) => {
  const form = useForm<FieldValues>({
    defaultValues: { items: initialItems },
  });
  formInstance = form;
  return (
    <FormProvider {...form}>
      <ArrayPieceProperty
        inputName="items"
        useMentionTextInput={false}
        arrayProperty={arrayProperty}
        disabled={false}
      />
    </FormProvider>
  );
};

describe('ArrayPieceProperty add item', () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    formInstance = undefined;
  });

  const mount = (initialItems?: unknown[]) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      root = createRoot(container!);
      root.render(<Harness initialItems={initialItems} />);
    });
  };

  const clickAddItem = () => {
    const button = Array.from(container!.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Add Item'),
    );
    act(() => button!.click());
  };

  const expectedNewItem = {
    dataType: 'text',
    pageNumber: 1,
    bold: true,
    tags: ['a'],
    name: '',
    enabled: false,
    choice: null,
  };

  it('fills new items with the declared child defaults', () => {
    mount();
    clickAddItem();
    expect(formInstance!.getValues('items')).toEqual([expectedNewItem]);
  });

  it('keeps existing items unchanged when adding and removing', () => {
    const existing = {
      dataType: 'number',
      pageNumber: 3,
      bold: false,
      tags: [],
      name: 'kept',
      enabled: true,
      choice: 'a',
    };
    mount([existing]);
    clickAddItem();
    expect(formInstance!.getValues('items')).toEqual([
      existing,
      expectedNewItem,
    ]);

    const removeButtons = Array.from(
      container!.querySelectorAll('button'),
    ).filter((b) => b.textContent?.includes('Remove'));
    act(() => removeButtons[1].click());
    expect(formInstance!.getValues('items')).toEqual([existing]);
  });
});
