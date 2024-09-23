import { TObject, Type } from '@sinclair/typebox';
import set from 'lodash/set';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

import { transformKeyWithReplacements } from '@/app/builder/step-settings/utils';
import {
  PieceMetadataModel,
  PiecePropertyMap,
} from '@activepieces/pieces-framework';
import { Action, Trigger } from '@activepieces/shared';

import { formUtils } from '../piece-properties/form-utils';

export type PieceSettingsContextState = {
  selectedStep: Action | Trigger;
  pieceModel: PieceMetadataModel | undefined;
  formSchema: TObject<any>;
  updateFormSchema: (key: string, newFieldSchema: PiecePropertyMap) => void;
};

export type PieceSettingsProviderProps = {
  selectedStep: Action | Trigger;
  pieceModel: PieceMetadataModel | undefined;
  children: ReactNode;
};

const PieceSettingsContext = createContext<
  PieceSettingsContextState | undefined
>(undefined);

const numberReplacement = 'anyOf[0]items';
const stringReplacement = 'properties.';

export const PieceSettingsProvider = ({
  selectedStep,
  pieceModel,
  children,
}: PieceSettingsProviderProps) => {
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
    if (schema) {
      formSchemaRef.current = true;
      setFormSchema(schema);
    }
  }

  const updateFormSchema = useCallback(
    (key: string, newFieldPropertyMap: PiecePropertyMap) => {
      setFormSchema((prevSchema: any) => {
        if (!prevSchema) return null;

        const newFieldSchema = formUtils.buildSchema(newFieldPropertyMap);

        const currentSchema = { ...prevSchema };
        const keyUpdated = transformKeyWithReplacements(
          key,
          numberReplacement,
          stringReplacement,
        );
        set(currentSchema, keyUpdated, newFieldSchema);

        return currentSchema;
      });
    },
    [],
  );

  return (
    <PieceSettingsContext.Provider
      value={{ selectedStep, pieceModel, formSchema, updateFormSchema }}
    >
      {children}
    </PieceSettingsContext.Provider>
  );
};

export const usePieceSettingsContext = () => {
  const context = useContext(PieceSettingsContext);
  if (context === undefined) {
    throw new Error(
      'usePieceSettingsContext must be used within a PieceSettingsProvider',
    );
  }
  return context;
};
