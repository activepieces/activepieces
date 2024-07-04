import {
  FormControl,
  FormGroup,
  UntypedFormBuilder,
  UntypedFormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  PieceProperty,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  getPropertyInitialValue,
  jsonValidator,
} from '@activepieces/ui/common';
import { isNil } from '@activepieces/shared';

export const createFormControlsWithTheirValidators = (
  fb: UntypedFormBuilder,
  propertiesMap: PiecePropertyMap,
  form: FormGroup,
  input: Record<string, any>,
  customizedInputs: Record<string, boolean | Record<string, boolean>>
) => {
  //Angular forms get enabled after adding controls automatically: https://github.com/angular/angular/issues/23236
  const isFormDisabled = form.disabled;
  removeAllFormControls(form);
  Object.entries(propertiesMap).forEach(([propertyName, property]) => {
    if (propertiesMap[propertyName].type === PropertyType.MARKDOWN) {
      return;
    }
    const value = input[propertyName];
    const validators: ValidatorFn[] = getPropertyValidators(
      property,
      customizedInputs,
      propertyName
    );
    const ctrl = createControl(fb, property, value, validators);
    form.addControl(propertyName, ctrl, { emitEvent: false });
  });
  if (isFormDisabled) {
    form.disable({ emitEvent: false });
  }
};

const removeAllFormControls = (form: UntypedFormGroup) => {
  Object.keys(form.controls).forEach((ctrlName) => {
    form.removeControl(ctrlName, { emitEvent: false });
  });
};

function createControl(
  fb: UntypedFormBuilder,
  property: PieceProperty,
  value: any,
  validators: ValidatorFn[]
) {
  if (property.type === PropertyType.DYNAMIC) {
    const fg = fb.group({});
    if (!isNil(value) && typeof value === 'object') {
      Object.entries(value).forEach(
        ([nestedFormControlName, nestedFormControlValue]) => {
          fg.addControl(
            nestedFormControlName,
            new FormControl(nestedFormControlValue),
            { emitEvent: false }
          );
        }
      );
    }
    return fg;
  }
  return new FormControl(getPropertyInitialValue(property, value), {
    validators: validators,
  });
}

function getPropertyValidators(
  property: PieceProperty,
  customizedInputs: Record<string, boolean | Record<string, boolean>>,
  propertyName: string
) {
  const validators: ValidatorFn[] = [];
  if (
    property.required &&
    property.type !== PropertyType.OBJECT &&
    property.type !== PropertyType.ARRAY &&
    property.type !== PropertyType.DYNAMIC
  ) {
    validators.push(Validators.required);
  }
  if (property.type === PropertyType.JSON && !customizedInputs[propertyName]) {
    validators.push(jsonValidator);
  }
  return validators;
}
