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
import { Action, setAtPath, Trigger } from '@activepieces/shared';

import { formUtils } from '../piece-properties/form-utils';

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
  selectedStep: Action | Trigger;
  pieceModel: PieceMetadataModel | undefined;
  formSchema: TObject<any>;
  updateFormSchema: (key: string, newFieldSchema: PiecePropertyMap) => void;
};

export type StepSettingsProviderProps = {
  selectedStep: Action | Trigger;
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
    Type.Object(Type.Any()),
  );
  const formSchemaRef = useRef<boolean>(false);

  if (!formSchemaRef.current && selectedStep) {
    const schema = formUtils.buildPieceSchema(
      selectedStep.type,
      selectedStep.settings.actionName ?? selectedStep.settings.triggerName,
      pieceModel ?? null,
    );
    formSchemaRef.current = true;
    setFormSchema(schema as TObject<any>);
  }

  const updateFormSchema = useCallback(
    (key: string, newFieldPropertyMap: PiecePropertyMap) => {
      setFormSchema((prevSchema) => {
        const newFieldSchema = formUtils.buildSchema(newFieldPropertyMap);
        const currentSchema = { ...prevSchema };
        const keyUpdated = createUpdatedSchemaKey(key);
        setAtPath(currentSchema, keyUpdated, newFieldSchema);
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
