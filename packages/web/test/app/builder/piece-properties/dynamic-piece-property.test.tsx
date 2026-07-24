/**
 * @vitest-environment jsdom
 */
import {
  PiecePropertyMap,
  Property,
} from '@activepieces/pieces-framework';
import * as React from 'react';
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

vi.mock('@/components/ui/skeleton', () => ({
  SkeletonList: () => null,
}));

vi.mock(
  '@/app/builder/piece-properties/dynamic-piece-properties-error-boundary',
  () => ({
    DynamicPropertiesErrorBoundary: ({ children }: React.PropsWithChildren) =>
      children,
  }),
);

vi.mock('@/app/builder/piece-properties/generic-properties-form', () => ({
  GenericPropertiesForm: () => null,
}));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type MutateOptions = {
  onSuccess: (response: { options: PiecePropertyMap }) => void;
  onError: () => void;
};

const mutateCalls: MutateOptions[] = [];

vi.mock('@/features/pieces', async () => {
  const { formUtils } = await vi.importActual<
    typeof import('@/features/pieces/utils/form-utils')
  >('@/features/pieces/utils/form-utils');
  return {
    formUtils,
    piecesHooks: {
      usePieceOptions: () => ({
        mutate: (_request: unknown, options: MutateOptions) => {
          mutateCalls.push(options);
        },
        isPending: false,
      }),
    },
  };
});

import { DynamicProperties } from '@/app/builder/piece-properties/dynamic-piece-property';

const shortTextSchema = (fieldNames: string[]): PiecePropertyMap => {
  const schema: PiecePropertyMap = {};
  fieldNames.forEach((fieldName) => {
    schema[fieldName] = Property.ShortText({
      displayName: fieldName,
      required: false,
    });
  });
  return schema;
};

let formInstance: UseFormReturn | undefined;

const Harness = () => {
  const form = useForm<FieldValues>({
    defaultValues: {
      settings: {
        input: {
          items: ['a'],
        },
      },
    },
  });
  formInstance = form;
  return (
    <FormProvider {...form}>
      <DynamicProperties
        refreshers={['items']}
        propertyName="fields"
        pieceName="@activepieces/piece-test"
        pieceVersion="0.0.1"
        actionOrTriggerName="test_action"
        disabled={false}
        placedInside="stepSettings"
        updateFormSchema={null}
        propertySettings={null}
        updatePropertySettingsSchema={null}
      />
    </FormProvider>
  );
};

describe('DynamicProperties refresher change', () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    mutateCalls.length = 0;
    formInstance = undefined;
  });

  const mount = () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      root = createRoot(container!);
      root.render(<Harness />);
    });
  };

  const resolveOptions = (options: PiecePropertyMap) => {
    const call = mutateCalls[mutateCalls.length - 1];
    act(() => call.onSuccess({ options }));
  };

  it('preserves user-entered values when a refresher gains an array item', () => {
    mount();
    expect(mutateCalls).toHaveLength(1);
    resolveOptions(shortTextSchema(['firstName', 'lastName']));

    act(() => {
      formInstance!.setValue('settings.input.fields.firstName', 'John');
      formInstance!.setValue('settings.input.fields.lastName', 'Doe');
    });

    act(() => formInstance!.setValue('settings.input.items', ['a', 'b']));
    expect(mutateCalls).toHaveLength(2);
    expect(formInstance!.getValues('settings.input.fields')).toBeNull();

    resolveOptions(shortTextSchema(['firstName', 'lastName']));

    expect(formInstance!.getValues('settings.input.fields')).toEqual({
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  it('drops values for keys absent from the new schema', () => {
    mount();
    resolveOptions(shortTextSchema(['firstName', 'lastName']));

    act(() => {
      formInstance!.setValue('settings.input.fields.firstName', 'John');
      formInstance!.setValue('settings.input.fields.lastName', 'Doe');
    });

    act(() => formInstance!.setValue('settings.input.items', ['a', 'b']));
    resolveOptions(shortTextSchema(['firstName', 'email']));

    expect(formInstance!.getValues('settings.input.fields')).toEqual({
      firstName: 'John',
      email: '',
    });
  });

  it('preserves values across rapid successive refresher changes', () => {
    mount();
    resolveOptions(shortTextSchema(['firstName']));

    act(() =>
      formInstance!.setValue('settings.input.fields.firstName', 'John'),
    );

    act(() => formInstance!.setValue('settings.input.items', ['a', 'b']));
    act(() => formInstance!.setValue('settings.input.items', ['a', 'b', 'c']));
    expect(mutateCalls).toHaveLength(3);

    resolveOptions(shortTextSchema(['firstName']));

    expect(formInstance!.getValues('settings.input.fields')).toEqual({
      firstName: 'John',
    });
  });

  it('applies defaults on first load when no prior value exists', () => {
    mount();
    resolveOptions(shortTextSchema(['firstName']));

    expect(formInstance!.getValues('settings.input.fields')).toEqual({
      firstName: '',
    });
  });

  it('ignores a stale response resolving after a newer one', () => {
    mount();
    resolveOptions(shortTextSchema(['firstName']));

    act(() =>
      formInstance!.setValue('settings.input.fields.firstName', 'John'),
    );

    act(() => formInstance!.setValue('settings.input.items', ['a', 'b']));
    act(() => formInstance!.setValue('settings.input.items', ['a', 'b', 'c']));
    expect(mutateCalls).toHaveLength(3);

    act(() =>
      mutateCalls[2].onSuccess({
        options: shortTextSchema(['firstName', 'email']),
      }),
    );
    act(() =>
      mutateCalls[1].onSuccess({ options: shortTextSchema(['firstName']) }),
    );

    expect(formInstance!.getValues('settings.input.fields')).toEqual({
      firstName: 'John',
      email: '',
    });
  });

  it('restores values when the options request fails', () => {
    mount();
    resolveOptions(shortTextSchema(['firstName']));

    act(() =>
      formInstance!.setValue('settings.input.fields.firstName', 'John'),
    );

    act(() => formInstance!.setValue('settings.input.items', ['a', 'b']));
    expect(formInstance!.getValues('settings.input.fields')).toBeNull();

    act(() => mutateCalls[1].onError());

    expect(formInstance!.getValues('settings.input.fields')).toEqual({
      firstName: 'John',
    });
  });
});
