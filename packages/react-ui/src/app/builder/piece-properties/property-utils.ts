import { PropertyExecutionType } from "@activepieces/shared";
import { UseFormReturn } from "react-hook-form";

type inputNameLiteral = `settings.input.${string}`;

const isInputNameLiteral = (
  inputName: string,
): inputName is inputNameLiteral => {
  return inputName.match(/settings\.input\./) !== null;
};

function handleDynamicValueToggleChange(form: UseFormReturn, mode: PropertyExecutionType, propertyName: string, inputName: string) {
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
      if (mode === PropertyExecutionType.DYNAMIC) {
        form.setValue(inputName, null, {
            shouldValidate: true,
        });
      } 
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