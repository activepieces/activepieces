import { FormControl, FormGroup, UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from "@angular/forms";
import { PieceProperty, PiecePropertyMap, PropertyType } from "@activepieces/pieces-framework";
import { jsonValidator } from "@activepieces/ui/common";
import { isNil } from "../../../../../../shared/src";

export const createFormControlsWithTheirValidators = (fb:UntypedFormBuilder,propertiesMap: PiecePropertyMap,form:FormGroup,input:Record<string,any>,customizedInputs:Record<string,boolean | Record<string,boolean>>) => {
    removeAllFormControls(form);
    Object.entries(propertiesMap).forEach(([propertyName, property]) => {1
      if(propertiesMap[propertyName].type === PropertyType.MARKDOWN)
      {
        return;
      }
      const value = input[propertyName];
      const validators: ValidatorFn[] = getPropertyValidators(property, customizedInputs, propertyName);
      const ctrl = createControl(fb, property, value, validators);
      form.addControl(propertyName, ctrl, { emitEvent: false });
    });
  }

  const removeAllFormControls = (form:UntypedFormGroup)=> {
    Object.keys(form.controls).forEach((ctrlName) => {
        form.removeControl(ctrlName, { emitEvent: false });
      });
  }
  const getControlValue = (property:PieceProperty, value:unknown) =>{
   if(isNil(value))
   {
    return parseControlValue(property, property.defaultValue);
   }
    return parseControlValue(property, value);
   
  }

  const parseControlValue = (property:PieceProperty, value:unknown)  => {
    switch(property.type)
    {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.NUMBER:
        case PropertyType.DATE_TIME:
        case PropertyType.FILE:
            return isNil(value)? '':  value;
        case PropertyType.ARRAY:
            return isNil(value)? [] : value;
        case PropertyType.OBJECT:
        case PropertyType.DYNAMIC:
            return isNil(value)? {}: value;
        case PropertyType.CHECKBOX:
            return isNil(value)? false: value;
        case PropertyType.BASIC_AUTH:
        case PropertyType.CUSTOM_AUTH:
        case PropertyType.OAUTH2:
        case PropertyType.SECRET_TEXT:
        case PropertyType.MARKDOWN:
        case PropertyType.DROPDOWN:
        case PropertyType.STATIC_DROPDOWN:
        case PropertyType.MULTI_SELECT_DROPDOWN:
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
            return isNil(value)? '' : value;
        //json value is returned as either an object or string from the server
        case PropertyType.JSON:
            return isNil(value)? '{}': typeof value === 'string'? value: JSON.stringify(value);
    }
  }

function createControl(fb:UntypedFormBuilder,property: PieceProperty, value: any, validators: ValidatorFn[]) {
    if(property.type === PropertyType.DYNAMIC)
    {
        return fb.group({});
    }
    return new FormControl(
        getControlValue(property, value),
        {
            validators: validators,
        }
    );
}

function getPropertyValidators(property: PieceProperty, customizedInputs: Record<string, boolean | Record<string, boolean>>, propertyName: string) {
    const validators: ValidatorFn[] = [];
    if (property.required &&
        property.type !== PropertyType.OBJECT &&
        property.type !== PropertyType.ARRAY &&
        property.type !== PropertyType.DYNAMIC) {
        validators.push(Validators.required);
    }
    if (property.type === PropertyType.JSON &&
        !customizedInputs[propertyName]) {
        validators.push(jsonValidator);
    }
    return validators;
}

