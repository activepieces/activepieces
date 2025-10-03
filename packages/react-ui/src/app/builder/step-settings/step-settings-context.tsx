import { TObject, Type } from '@sinclair/typebox';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

import {
  PieceMetadataModel,
  PiecePropertyMap,
} from '@activepieces/pieces-framework';
import { FlowAction, setAtPath, FlowTrigger, PropertySettings } from '@activepieces/shared';

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
  updateFormSchema: (key: string, newFieldSchema: PiecePropertyMap, propertySettings: Record<string, PropertySettings>) => void;
  updateFormFieldSchemaWithAuto: (schemaPropertyPath: string) => void;
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
      selectedStep.settings.propertySettings,
    );
    formSchemaInitializedRef.current = true;
    setFormSchema(schema as TObject<any>);
  }

  const updateFormSchema = useCallback(
    (key: string, newFieldPropertyMap: PiecePropertyMap, propertySettings: Record<string, PropertySettings>) => {
      setFormSchema((prevSchema) => {
        const newFieldSchema = formUtils.buildSchema(newFieldPropertyMap, propertySettings);
        const currentSchema = { ...prevSchema };
        const keyUpdated = createUpdatedSchemaKey(key);
        setAtPath(currentSchema, keyUpdated, newFieldSchema);
        return currentSchema;
      });
    },
    [],
  );

  const updateFormFieldSchemaWithAuto = useCallback(
    (schemaPropertyPath: string) => {
      setFormSchema((prevSchema) => {
        const currentSchema = { ...prevSchema };
        const keyUpdated = createUpdatedSchemaKey(schemaPropertyPath);
        setAtPath(currentSchema, keyUpdated, Type.Undefined());
        return currentSchema;
      });
    },
    [],
  );

  return (
    <StepSettingsContext.Provider
      value={{
        selectedStep,
        pieceModel,
        formSchema,
        updateFormSchema,
        updateFormFieldSchemaWithAuto
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
