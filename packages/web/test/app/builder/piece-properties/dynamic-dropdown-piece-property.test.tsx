/**
 * @vitest-environment jsdom
 */
import { DropdownState } from '@activepieces/pieces-framework';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'test-project' },
}));

vi.mock('@/app/builder/builder-hooks', () => ({
  useBuilderStateContext: (
    selector: (state: Record<string, unknown>) => unknown,
  ) =>
    selector({
      flowVersion: { id: 'flow-version-id', flowId: 'flow-id' },
      readonly: false,
    }),
}));

vi.mock(
  '@/app/builder/piece-properties/dynamic-piece-properties-error-boundary',
  () => ({
    DynamicPropertiesErrorBoundary: ({ children }: React.PropsWithChildren) =>
      children,
  }),
);

const searchCalls: ((term: string) => void)[] = [];

vi.mock('@/components/custom/searchable-select', () => ({
  SearchableSelect: ({
    refreshOnSearch,
  }: {
    refreshOnSearch?: (term: string) => void;
  }) => {
    if (refreshOnSearch) {
      searchCalls.push(refreshOnSearch);
    }
    return null;
  },
}));

type RenderedOption = { label: string; value: unknown };

const multiSelectRenders: {
  options: RenderedOption[];
  cachedOptions: RenderedOption[];
}[] = [];

vi.mock('@/components/custom/multi-select-piece-property', () => ({
  MultiSelectPieceProperty: ({
    options,
    cachedOptions,
  }: {
    options: RenderedOption[];
    cachedOptions?: RenderedOption[];
  }) => {
    multiSelectRenders.push({ options, cachedOptions: cachedOptions ?? [] });
    return null;
  },
}));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type MutateOptions = {
  onSuccess: (response: { options: DropdownState<unknown> }) => void;
};

type MutateCall = MutateOptions & { propertyName: string };

const mutateCalls: MutateCall[] = [];

type MutateRequest = { request: { propertyName: string } };

vi.mock('@/features/pieces', () => ({
  piecesHooks: {
    usePieceOptions: () => ({
      mutate: (request: MutateRequest, options: MutateOptions) => {
        mutateCalls.push({
          ...options,
          propertyName: request.request.propertyName,
        });
      },
      isPending: false,
    }),
  },
}));

import { DynamicDropdownPieceProperty } from '@/app/builder/piece-properties/dynamic-dropdown-piece-property';

const dropdownState = (values: unknown[]): DropdownState<unknown> => ({
  disabled: false,
  options: values.map((value) => ({ label: String(value), value })),
});

const DROPDOWN_PATH = 'settings.input.selection';
const CHILD_DROPDOWN_PATH = 'settings.input.childSelection';

let formInstance: UseFormReturn | undefined;

const Harness = ({
  multiple,
  refreshOnSearch,
}: {
  multiple: boolean;
  refreshOnSearch?: boolean;
}) => {
  const form = useForm<FieldValues>({
    defaultValues: {
      settings: {
        input: {
          workspace: 'first',
          selection: null,
        },
      },
    },
  });
  formInstance = form;
  return (
    <FormProvider {...form}>
      <ValueBridge
        form={form}
        multiple={multiple}
        refreshOnSearch={refreshOnSearch}
      />
    </FormProvider>
  );
};

const ChainedHarness = () => {
  const form = useForm<FieldValues>({
    defaultValues: {
      settings: {
        input: {
          workspace: 'first',
          selection: null,
          childSelection: null,
        },
      },
    },
  });
  formInstance = form;
  return (
    <FormProvider {...form}>
      <ValueBridge form={form} multiple={false} />
      <ValueBridge
        form={form}
        multiple={false}
        propertyName="childSelection"
        refreshers={['selection']}
      />
    </FormProvider>
  );
};

const ValueBridge = ({
  form,
  multiple,
  propertyName = 'selection',
  refreshers = ['workspace'],
  refreshOnSearch = false,
}: {
  form: UseFormReturn;
  multiple: boolean;
  propertyName?: string;
  refreshers?: string[];
  refreshOnSearch?: boolean;
}) => {
  const value = useWatch({
    control: form.control,
    name: `settings.input.${propertyName}`,
  });
  return (
    <DynamicDropdownPieceProperty
      refreshers={refreshers}
      propertyName={propertyName}
      value={value}
      multiple={multiple}
      disabled={false}
      onChange={(newValue) =>
        form.setValue(`settings.input.${propertyName}`, newValue)
      }
      actionOrTriggerName="test_action"
      pieceName="@activepieces/piece-test"
      pieceVersion="0.0.1"
      form={form}
      placedInside="stepSettings"
      shouldRefreshOnSearch={refreshOnSearch}
    />
  );
};

describe('DynamicDropdownPieceProperty refresher change', () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    mutateCalls.length = 0;
    searchCalls.length = 0;
    multiSelectRenders.length = 0;
    formInstance = undefined;
  });

  const mount = (
    {
      multiple,
      refreshOnSearch,
    }: { multiple: boolean; refreshOnSearch?: boolean } = { multiple: false },
  ) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      root = createRoot(container!);
      root.render(
        <Harness multiple={multiple} refreshOnSearch={refreshOnSearch} />,
      );
    });
  };

  const resolveOptions = (values: unknown[]) => {
    const call = mutateCalls[mutateCalls.length - 1];
    act(() => call.onSuccess({ options: dropdownState(values) }));
  };

  const resolveFor = (propertyName: string, values: unknown[]) => {
    const call = mutateCalls
      .filter((mutateCall) => mutateCall.propertyName === propertyName)
      .pop();
    act(() => call!.onSuccess({ options: dropdownState(values) }));
  };

  const changeRefresher = (workspace: string) => {
    act(() => formInstance!.setValue('settings.input.workspace', workspace));
  };

  it('keeps the selection when the new options still contain it', () => {
    mount();
    resolveOptions(['sheet-a', 'sheet-b']);
    act(() => formInstance!.setValue(DROPDOWN_PATH, 'sheet-b'));

    changeRefresher('second');
    expect(mutateCalls).toHaveLength(2);
    expect(formInstance!.getValues(DROPDOWN_PATH)).toBeNull();

    resolveOptions(['sheet-a', 'sheet-b']);

    expect(formInstance!.getValues(DROPDOWN_PATH)).toBe('sheet-b');
  });

  it('keeps an object-valued selection matched by deep equality', () => {
    mount();
    resolveOptions([{ id: 1 }, { id: 2 }]);
    act(() => formInstance!.setValue(DROPDOWN_PATH, { id: 2 }));

    changeRefresher('second');
    resolveOptions([{ id: 1 }, { id: 2 }]);

    expect(formInstance!.getValues(DROPDOWN_PATH)).toEqual({ id: 2 });
  });

  it('clears the selection when the new options no longer contain it', () => {
    mount();
    resolveOptions(['sheet-a', 'sheet-b']);
    act(() => formInstance!.setValue(DROPDOWN_PATH, 'sheet-b'));

    changeRefresher('second');
    resolveOptions(['sheet-c']);

    expect(formInstance!.getValues(DROPDOWN_PATH)).toBeNull();
  });

  it('rebuilds the cached option list for the new refresher', () => {
    mount({ multiple: true });
    resolveOptions(['sheet-a', 'sheet-b', 'sheet-c']);
    act(() => formInstance!.setValue(DROPDOWN_PATH, ['sheet-c']));

    changeRefresher('second');
    resolveOptions(['sheet-c', 'sheet-d']);

    expect(formInstance!.getValues(DROPDOWN_PATH)).toEqual(['sheet-c']);
    const lastRender = multiSelectRenders[multiSelectRenders.length - 1];
    expect(lastRender.cachedOptions).toEqual(lastRender.options);
  });

  it('never pins the cached option list to a failed, empty response', () => {
    mount({ multiple: true });
    resolveOptions([]);
    resolveOptions(['sheet-a', 'sheet-b']);

    const lastRender = multiSelectRenders[multiSelectRenders.length - 1];
    expect(lastRender.cachedOptions).toEqual(lastRender.options);
  });

  it('keeps only the multi-select values still present in the new options', () => {
    mount({ multiple: true });
    resolveOptions(['a', 'b', 'c']);
    act(() => formInstance!.setValue(DROPDOWN_PATH, ['a', 'c']));

    changeRefresher('second');
    resolveOptions(['a', 'b']);

    expect(formInstance!.getValues(DROPDOWN_PATH)).toEqual(['a']);
  });

  it('ignores a stale response resolving after a newer one', () => {
    mount();
    resolveOptions(['sheet-a', 'sheet-b']);
    act(() => formInstance!.setValue(DROPDOWN_PATH, 'sheet-b'));

    changeRefresher('second');
    changeRefresher('third');
    expect(mutateCalls).toHaveLength(3);

    act(() =>
      mutateCalls[2].onSuccess({ options: dropdownState(['sheet-b']) }),
    );
    act(() =>
      mutateCalls[1].onSuccess({ options: dropdownState(['only-stale']) }),
    );

    expect(formInstance!.getValues(DROPDOWN_PATH)).toBe('sheet-b');
  });

  it('keeps the selection pending while a response carries no options', () => {
    mount();
    resolveOptions(['sheet-a', 'sheet-b']);
    act(() => formInstance!.setValue(DROPDOWN_PATH, 'sheet-b'));

    changeRefresher('second');
    resolveOptions([]);
    expect(formInstance!.getValues(DROPDOWN_PATH)).toBeNull();

    changeRefresher('third');
    resolveOptions(['sheet-a', 'sheet-b']);

    expect(formInstance!.getValues(DROPDOWN_PATH)).toBe('sheet-b');
  });

  it('restores a chained dropdown whose parent refresher is cleared first', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      root = createRoot(container!);
      root.render(<ChainedHarness />);
    });

    resolveFor('selection', ['sheet-a', 'sheet-b']);
    resolveFor('childSelection', ['row-1', 'row-2']);
    act(() => {
      formInstance!.setValue(DROPDOWN_PATH, 'sheet-b');
      formInstance!.setValue(CHILD_DROPDOWN_PATH, 'row-2');
    });

    changeRefresher('second');
    resolveFor('childSelection', []);
    resolveFor('selection', ['sheet-a', 'sheet-b']);
    expect(formInstance!.getValues(DROPDOWN_PATH)).toBe('sheet-b');

    resolveFor('childSelection', ['row-1', 'row-2']);

    expect(formInstance!.getValues(CHILD_DROPDOWN_PATH)).toBe('row-2');
  });

  it('restores from the full list even when a search response arrives first', () => {
    mount({ multiple: false, refreshOnSearch: true });
    resolveOptions(['sheet-a', 'sheet-b']);
    act(() => formInstance!.setValue(DROPDOWN_PATH, 'sheet-b'));

    changeRefresher('second');
    act(() => searchCalls.pop()!('sheet-a'));
    expect(mutateCalls).toHaveLength(3);

    act(() =>
      mutateCalls[2].onSuccess({ options: dropdownState(['sheet-a']) }),
    );
    expect(formInstance!.getValues(DROPDOWN_PATH)).toBeNull();

    act(() =>
      mutateCalls[1].onSuccess({
        options: dropdownState(['sheet-a', 'sheet-b']),
      }),
    );

    expect(formInstance!.getValues(DROPDOWN_PATH)).toBe('sheet-b');
  });

  it('never overwrites a value the user picked while a restore was pending', () => {
    mount();
    resolveOptions(['sheet-a', 'sheet-b']);
    act(() => formInstance!.setValue(DROPDOWN_PATH, 'sheet-b'));

    changeRefresher('second');
    act(() => formInstance!.setValue(DROPDOWN_PATH, 'sheet-a'));
    resolveOptions(['sheet-a', 'sheet-b']);

    expect(formInstance!.getValues(DROPDOWN_PATH)).toBe('sheet-a');
  });

  it('does not resurrect a selection the user cleared without a refresher change', () => {
    mount();
    resolveOptions(['sheet-a', 'sheet-b']);
    act(() => formInstance!.setValue(DROPDOWN_PATH, 'sheet-b'));
    act(() => formInstance!.setValue(DROPDOWN_PATH, null));

    resolveOptions(['sheet-a', 'sheet-b']);

    expect(formInstance!.getValues(DROPDOWN_PATH)).toBeNull();
  });
});
