import { TObject, Type } from '@sinclair/typebox';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { UseFormReturn } from 'react-hook-form';

import {
  PieceMetadataModel,
  PiecePropertyMap,
  piecePropertiesUtils,
} from '@activepieces/pieces-framework';
import {
  FlowAction,
  setAtPath,
  FlowTrigger,
  PropertyExecutionType,
} from '@activepieces/shared';

import { formUtils } from '../../../features/pieces/lib/form-utils';
const numberReplacement = 'anyOf[0]items';
const stringReplacement = 'properties.';
const createUpdatedSchemaKey = (propertyKey: string) => {
  return propertyKey
    .split('.')
    .map((part) => {
      if (part === '') {
        return ''; // Keep empty parts intact (for consecutive dots)
      } else if (!isNaN(Number(part))) {
        return numberReplacement;
      } else {
        return `${stringReplacement}${part}`;
      }
    })
    .join('.');
};

export type StepSettingsContextState = {
  selectedStep: FlowAction | FlowTrigger;
  pieceModel: PieceMetadataModel | undefined;
  formSchema: TObject<any>;
  updateFormSchema: (key: string, newFieldSchema: PiecePropertyMap) => void;
  updatePropertySettingsSchema: (
    schema: PiecePropertyMap,
    propertyName: string,
    form: UseFormReturn,
  ) => void;
};

export type StepSettingsProviderProps = {
  selectedStep: FlowAction | FlowTrigger;
  pieceModel: PieceMetadataModel | undefined;
  children: ReactNode;
};

const StepSettingsContext = createContext<StepSettingsContextState | undefined>(
  undefined,
);

export const StepSettingsProvider = ({
  selectedStep,
  pieceModel,
  children,
}: StepSettingsProviderProps) => {
  const [formSchema, setFormSchema] = useState<TObject<any>>(
    Type.Object(Type.Unknown()),
  );
  const formSchemaInitializedRef = useRef<boolean>(false);

  if (!formSchemaInitializedRef.current && selectedStep) {
    const schema = formUtils.buildPieceSchema(
      selectedStep.type,
      selectedStep.settings.actionName ?? selectedStep.settings.triggerName,
      pieceModel ?? null,
    );
    formSchemaInitializedRef.current = true;
    setFormSchema(schema as TObject<any>);
  }

  const updateFormSchema = useCallback(
    (key: string, newFieldPropertyMap: PiecePropertyMap) => {
      setFormSchema((prevSchema) => {
        const newFieldSchema = piecePropertiesUtils.buildSchema(
          newFieldPropertyMap,
          undefined,
        );
        const currentSchema = { ...prevSchema };
        const keyUpdated = createUpdatedSchemaKey(key);
        setAtPath(currentSchema, keyUpdated, newFieldSchema);
        return currentSchema;
      });
    },
    [],
  );
  const updatePropertySettingsSchema = (
    schema: PiecePropertyMap,
    propertyName: string,
    form: UseFormReturn,
  ) => {
    // previously step settings schema didn't have this property, so we need to set it
    // we can't always set it to MANUAL, because some sub properties might be dynamic and have the same name as the dynamic (parent) property i.e values property in insert row (Google Sheets)
    // which will override the sub property exectuion type
    if (!selectedStep.settings?.propertySettings?.[propertyName]) {
      form.setValue(
        `settings.propertySettings.${propertyName}.type`,
        PropertyExecutionType.MANUAL,
      );
    }
    form.setValue(`settings.propertySettings.${propertyName}.schema`, schema);
  };
  return (
    <StepSettingsContext.Provider
      //need to re-render the form because sample data is changed outside of it, this will be fixed once we refactor the state
      key={selectedStep.settings.sampleData?.lastTestDate}
      value={{
        selectedStep,
        pieceModel,
        formSchema,
        updateFormSchema,
        updatePropertySettingsSchema,
      }}
    >
      {children}
    </StepSettingsContext.Provider>
  );
};

export const useStepSettingsContext = () => {
  const context = useContext(StepSettingsContext);
  if (context === undefined) {
    throw new Error(
      'useStepSettingsContext must be used within a PieceSettingsProvider',
    );
  }
  return context;
};
