/**
 * @vitest-environment jsdom
 */
import {
  DropdownState,
  PiecePropertyMap,
  Property,
} from '@activepieces/pieces-framework';
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

const { Pass } = vi.hoisted(() => ({
  Pass: ({ children }: React.PropsWithChildren) => children,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'test-project' },
}));

vi.mock('@/app/builder/builder-hooks', () => ({
  useOptionalBuilderStateContext: (
    selector: (state: Record<string, unknown>) => unknown,
  ) =>
    selector({
      flowVersion: { id: 'flow-version-id', flowId: 'flow-id' },
      readonly: false,
    }),
}));

vi.mock(
  '@/app/builder/piece-properties/dynamic-piece-properties-error-boundary',
  () => ({ DynamicPropertiesErrorBoundary: Pass }),
);
vi.mock('@/components/custom/searchable-select', () => ({
  SearchableSelect: () => null,
}));
vi.mock('@/components/custom/multi-select-piece-property', () => ({
  MultiSelectPieceProperty: () => null,
}));
vi.mock('@/components/ui/skeleton', () => ({ SkeletonList: () => null }));
vi.mock('@/app/builder/piece-properties/generic-properties-form', () => ({
  GenericPropertiesForm: () => null,
}));

type DialogSetOpen = (
  open: boolean,
  connection?: { externalId: string },
) => Promise<void>;
let dialogSetOpen: DialogSetOpen | undefined;
vi.mock('@/app/connections/create-edit-connection-dialog', () => ({
  CreateOrEditConnectionDialog: (props: { setOpen: DialogSetOpen }) => {
    dialogSetOpen = props.setOpen;
    return null;
  },
}));
vi.mock('@/components/ui/select', () => ({
  Select: Pass,
  SelectAction: Pass,
  SelectContent: Pass,
  SelectItem: Pass,
  SelectTrigger: Pass,
  SelectValue: Pass,
}));
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: Pass,
  TooltipContent: Pass,
  TooltipTrigger: Pass,
}));
vi.mock('@/components/custom/permission-needed-tooltip', () => ({
  PermissionNeededTooltip: Pass,
}));
vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
  useIsPlatformAdmin: () => true,
}));
vi.mock('@/features/connections', () => ({
  appConnectionsQueries: {
    useAppConnections: () => ({
      data: {
        data: [
          {
            externalId: 'sheets-conn',
            displayName: 'Google Sheets',
            status: 'ACTIVE',
            scope: 'PROJECT',
            pieceName: '@activepieces/piece-test',
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: () => Promise.resolve(),
    }),
  },
  appConnectionUtils: { getConnectionAccountIdentifier: () => null },
}));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type MutateOptions = {
  onSuccess: (response: { options: unknown }) => void;
};
const mutateCalls: { propertyName: string; options: MutateOptions }[] = [];

vi.mock('@/features/pieces', async () => {
  const { formUtils } = await vi.importActual<
    typeof import('@/features/pieces/utils/form-utils')
  >('@/features/pieces/utils/form-utils');
  return {
    formUtils,
    piecesHooks: {
      usePiece: () => ({
        pieceModel: { name: '@activepieces/piece-test', version: '0.0.1' },
        isLoading: false,
      }),
      usePieceOptions: () => ({
        mutate: (
          request: { request: { propertyName: string } },
          options: MutateOptions,
        ) => {
          mutateCalls.push({
            propertyName: request.request.propertyName,
            options,
          });
        },
        isPending: false,
      }),
    },
  };
});

import { DynamicDropdownPieceProperty } from '@/app/builder/piece-properties/dynamic-dropdown-piece-property';
import { DynamicProperties } from '@/app/builder/piece-properties/dynamic-piece-property';
import { DynamicPropertiesProvider } from '@/app/builder/piece-properties/dynamic-properties-context';
import { ConnectionSelect } from '@/app/connections/connection-select';

const CONNECTION_VALUE = "{{connections['sheets-conn']}}";

let formInstance: UseFormReturn | undefined;

const StepHarness = ({ dropdown }: { dropdown: DropdownVariant }) => {
  const form = useForm<FieldValues>({
    defaultValues: {
      settings: {
        input: { auth: CONNECTION_VALUE, spreadsheet: null, fields: null },
      },
    },
  });
  formInstance = form;
  const auth = useWatch({ control: form.control, name: 'settings.input.auth' });
  const spreadsheet = useWatch({
    control: form.control,
    name: 'settings.input.spreadsheet',
  });
  return (
    <FormProvider {...form}>
      <DynamicPropertiesProvider>
        <ConnectionSelect
          piece={
            { name: '@activepieces/piece-test', version: '0.0.1' } as never
          }
          value={auth}
          onChange={(value) => form.setValue('settings.input.auth', value)}
        />
        <DynamicDropdownPieceProperty
          refreshers={[]}
          propertyName="spreadsheet"
          value={spreadsheet}
          disabled={false}
          multiple={dropdown === 'multiple'}
          shouldRefreshOnSearch={dropdown === 'search'}
          onChange={(value) =>
            form.setValue('settings.input.spreadsheet', value)
          }
          actionOrTriggerName="insert_row"
          pieceName="@activepieces/piece-test"
          pieceVersion="0.0.1"
          form={form}
          placedInside="stepSettings"
        />
        <DynamicProperties
          refreshers={[]}
          propertyName="fields"
          pieceName="@activepieces/piece-test"
          pieceVersion="0.0.1"
          actionOrTriggerName="insert_row"
          disabled={false}
          placedInside="stepSettings"
          updateFormSchema={null}
          propertySettings={null}
          updatePropertySettingsSchema={null}
        />
      </DynamicPropertiesProvider>
    </FormProvider>
  );
};

const dropdownState = (values: string[]): DropdownState<unknown> => ({
  disabled: false,
  options: values.map((value) => ({ label: value, value })),
});
const shortTextFields = (names: string[]): PiecePropertyMap =>
  Object.fromEntries(
    names.map((name) => [
      name,
      Property.ShortText({ displayName: name, required: false }),
    ]),
  );

describe('ConnectionSelect reconnect', () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    mutateCalls.length = 0;
    formInstance = undefined;
    dialogSetOpen = undefined;
  });

  const callsFor = (name: string) =>
    mutateCalls.filter((call) => call.propertyName === name);
  const resolveLatest = (name: string, options: unknown) => {
    const call = callsFor(name).at(-1)!;
    act(() => call.options.onSuccess({ options }));
  };
  const getInput = (name: string) =>
    formInstance!.getValues(`settings.input.${name}`);

  const mountWithOldAccountValues = (dropdown: DropdownVariant = 'single') => {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      root = createRoot(container!);
      root.render(<StepHarness dropdown={dropdown} />);
    });
    resolveLatest('spreadsheet', dropdownState(['old-sheet', 'shared-sheet']));
    resolveLatest('fields', shortTextFields(['column_a']));
    act(() => {
      formInstance!.setValue(
        'settings.input.spreadsheet',
        dropdown === 'multiple' ? ['old-sheet', 'shared-sheet'] : 'old-sheet',
      );
      formInstance!.setValue('settings.input.fields.column_a', 'hello');
    });
    expect(callsFor('spreadsheet')).toHaveLength(1);
    expect(callsFor('fields')).toHaveLength(1);
  };

  const finishDialog = async (connection?: { externalId: string }) => {
    await act(async () => {
      await dialogSetOpen!(false, connection);
    });
  };

  const openReconnectDialog = () => {
    act(() => {
      container!
        .querySelector('button')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  };

  const reconnect = async () => {
    openReconnectDialog();
    await finishDialog({ externalId: 'sheets-conn' });
  };

  it('reloads the dependent dropdown and keeps the old value the new options still list', async () => {
    mountWithOldAccountValues();
    await reconnect();

    expect(getInput('auth')).toBe(CONNECTION_VALUE);
    expect(callsFor('spreadsheet')).toHaveLength(2);
    expect(getInput('spreadsheet')).toBe('old-sheet');

    resolveLatest('spreadsheet', dropdownState(['new-sheet', 'old-sheet']));
    expect(getInput('spreadsheet')).toBe('old-sheet');
  });

  it('clears the dependent dropdown once the new options no longer list the old value', async () => {
    mountWithOldAccountValues();
    await reconnect();

    resolveLatest('spreadsheet', dropdownState(['new-sheet']));
    expect(getInput('spreadsheet')).toBeNull();
  });

  it('clears the dependent dropdown when the new account lists nothing', async () => {
    mountWithOldAccountValues();
    await reconnect();

    resolveLatest('spreadsheet', dropdownState([]));
    expect(getInput('spreadsheet')).toBeNull();
  });

  it('keeps only the multi-select values the new options still list', async () => {
    mountWithOldAccountValues('multiple');
    await reconnect();

    resolveLatest('spreadsheet', dropdownState(['new-sheet', 'shared-sheet']));
    expect(getInput('spreadsheet')).toEqual(['shared-sheet']);
  });

  it('keeps the value of a search-loaded dropdown, whose first page cannot show it is gone', async () => {
    mountWithOldAccountValues('search');
    await reconnect();

    resolveLatest('spreadsheet', dropdownState(['new-sheet']));
    expect(getInput('spreadsheet')).toBe('old-sheet');
  });

  it('reloads dynamic properties and keeps only the fields the new schema still has', async () => {
    mountWithOldAccountValues();
    await reconnect();

    expect(callsFor('fields')).toHaveLength(2);
    expect(getInput('fields')).toEqual({ column_a: 'hello' });

    resolveLatest('fields', shortTextFields(['column_b']));
    expect(getInput('fields')).toEqual({ column_b: '' });
  });

  it('keeps dynamic property values whose fields are still in the new schema', async () => {
    mountWithOldAccountValues();
    await reconnect();

    resolveLatest('fields', shortTextFields(['column_a', 'column_b']));
    expect(getInput('fields')).toEqual({ column_a: 'hello', column_b: '' });
  });

  it('changes nothing when the reconnect dialog is closed without reconnecting', async () => {
    mountWithOldAccountValues();
    openReconnectDialog();
    await finishDialog();

    expect(callsFor('spreadsheet')).toHaveLength(1);
    expect(callsFor('fields')).toHaveLength(1);
    expect(getInput('spreadsheet')).toBe('old-sheet');
  });

  it('resets dependent inputs once when a new connection is created from the select', async () => {
    mountWithOldAccountValues();
    await finishDialog({ externalId: 'new-conn' });

    expect(getInput('auth')).toBe("{{connections['new-conn']}}");
    expect(callsFor('spreadsheet')).toHaveLength(2);
    expect(callsFor('fields')).toHaveLength(2);
    expect(getInput('spreadsheet')).toBeNull();
  });
});

type DropdownVariant = 'single' | 'multiple' | 'search';
