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

function handleDynamicValueToggleChange({ form, mode, property, propertyName, inputName }: HandleDynamicValueToggleChangeProps) {
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
    if (isInputNameLiteral(inputName)) {
      const currentValue = form.getValues(inputName);
      if (mode === PropertyExecutionType.DYNAMIC) {
        const newValue = getDefaultValueForDynamicProperty(property, currentValue);
        form.setValue(inputName, newValue, {
            shouldValidate: true,
        });
        return;
      } 
      form.setValue(inputName, property.defaultValue ?? null, {
        shouldValidate: true,
    });
    } else {
      throw new Error(
        'inputName is not a member of step settings input, you might be using dynamic properties where you should not',
      );
    }
}

const propertyUtils = {
  handleDynamicValueToggleChange,
};

export { propertyUtils };

type HandleDynamicValueToggleChangeProps = {
  form: UseFormReturn;
  mode: PropertyExecutionType;
  property: PieceProperty;
  propertyName: string;
  inputName: string;
}