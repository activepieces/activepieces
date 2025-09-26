import { PropertyExecutionType } from "@activepieces/shared";
import { UseFormReturn } from "react-hook-form";
import { PropertyType, PieceProperty } from "@activepieces/pieces-framework";

type inputNameLiteral = `settings.input.${string}`;

const getDefaultValueForDynamicProperty = (property: PieceProperty, currentValue: unknown) => {
  if (property.type === PropertyType.ARRAY) {
    return null;
  }
  return typeof currentValue === 'string' || typeof currentValue === 'number' ? currentValue : JSON.stringify(currentValue);
}

const isInputNameLiteral = (
  inputName: string,
): inputName is inputNameLiteral => {
  return inputName.match(/settings\.input\./) !== null;
};

function handleDynamicValueToggleChange({ form, mode, propertyName }: HandleDynamicValueToggleChangeProps) {
    const propertySettingsForSingleProperty = {
      ...form.getValues().settings?.propertySettings?.[propertyName],
      type: mode,
    };
    form.setValue(
      `settings.propertySettings.${propertyName}`,
      propertySettingsForSingleProperty,
      {
        shouldValidate: true,
      },
    );

    if (mode === PropertyExecutionType.DYNAMIC) {
      const propertySettings = form.getValues().settings?.propertySettings;
      const property = propertySettings?.[propertyName]?.schema ?? propertySettings?.[propertyName];
      const inputName = `settings.input.${propertyName}`;
      
      if (isInputNameLiteral(inputName)) {
        const currentValue = form.getValues(inputName);
        const newValue = getDefaultValueForDynamicProperty(property, currentValue);
        form.setValue(inputName, newValue, {
            shouldValidate: true,
        });
        form.setValue(inputName, property.defaultValue ?? null, {
          shouldValidate: true,
        });
      }
    }
}

const propertyUtils = {
  handleDynamicValueToggleChange,
};

export { propertyUtils };

type HandleDynamicValueToggleChangePropsDynamic = {
  mode: PropertyExecutionType.DYNAMIC,
  form: UseFormReturn,
  property: PieceProperty,
  propertyName: string,
  inputName: string,
}

type HandleDynamicValueToggleChangePropsManualOrAuto = {
  mode: PropertyExecutionType.MANUAL | PropertyExecutionType.AUTO,
  form: UseFormReturn,
  propertyName: string,
}

type HandleDynamicValueToggleChangeProps = HandleDynamicValueToggleChangePropsManualOrAuto | HandleDynamicValueToggleChangePropsDynamic;