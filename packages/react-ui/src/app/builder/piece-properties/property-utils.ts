import { PropertyExecutionType, FlowOperationType, FlowOperationRequest, PropertySettings } from "@activepieces/shared";
import { UseFormReturn } from "react-hook-form";
import { PropertyType, PieceProperty, PiecePropertyMap } from "@activepieces/pieces-framework";

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

function handlePropertyExecutionModeChange({ form, mode, propertyName, inputName, updateFormFieldSchemaWithAuto }: HandlePropertyExecutionModeChangeProps) {
    const propertySettingsForSingleProperty = {
      ...form.getValues().settings?.propertySettings?.[propertyName],
      type: mode,
      schema: undefined,
    };
    form.setValue(
      `settings.propertySettings.${propertyName}`,
      propertySettingsForSingleProperty,
      {
        shouldValidate: true,
      },
    );
    const propertySettings = form.getValues().settings?.propertySettings;

    if (mode === PropertyExecutionType.AUTO) {
      updateFormFieldSchemaWithAuto(inputName);
    }
    
    setTimeout(() => {
      if (mode === PropertyExecutionType.DYNAMIC || mode === PropertyExecutionType.AUTO) {
        const property = propertySettings?.[propertyName]?.schema ?? propertySettings?.[propertyName];
        
        if (isInputNameLiteral(inputName)) {
          const currentValue = form.getValues(inputName);
          const newValue = mode === PropertyExecutionType.AUTO ? undefined : getDefaultValueForDynamicProperty(property, currentValue);
          form.setValue(inputName, newValue, {
              shouldValidate: true,
          });
        }
      }
      form.trigger();
    }, 0);

}

const propertyUtils = {
  handlePropertyExecutionModeChange,
};

export { propertyUtils };

type HandlePropertyExecutionModeChangeProps = {
  mode: PropertyExecutionType,
  form: UseFormReturn,
  property: PieceProperty,
  propertyName: string,
  inputName: string,
  updateFormFieldSchemaWithAuto: (schemaPropertyPath: string) => void,
}