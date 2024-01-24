import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework';
import {
  FormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { jsonValidator } from '@activepieces/ui/common';

export function createConfigsFormControls(
  properties: PiecePropertyMap,
  propertiesValues: Record<string, unknown>,
  fb: FormBuilder,
  customizedInputs?: Record<string, boolean>
) {
  const controls: { [key: string]: UntypedFormControl | UntypedFormGroup } = {};
  Object.keys(properties).forEach((pk) => {
    const validators: ValidatorFn[] = [];
    const prop = properties[pk];
    const propValue = propertiesValues[pk];
    switch (prop.type) {
      case PropertyType.ARRAY: {
        const controlValue = propValue
          ? propValue
          : Array.isArray(prop.defaultValue) && prop.defaultValue.length > 0
          ? prop.defaultValue
          : [];
        controls[pk] = new UntypedFormControl(controlValue);
        break;
      }
      case PropertyType.MARKDOWN: {
        break;
      }
      case PropertyType.OBJECT: {
        const controlValue = propValue
          ? propValue
          : typeof prop.defaultValue === 'object'
          ? prop.defaultValue
          : {};
        controls[pk] = new UntypedFormControl(controlValue);
        break;
      }
      case PropertyType.BASIC_AUTH:
      case PropertyType.CUSTOM_AUTH:
      case PropertyType.OAUTH2:
      case PropertyType.SECRET_TEXT: {
        if (prop.required) {
          validators.push(Validators.required);
        }
        controls[pk] = new UntypedFormControl(propValue, validators);
        break;
      }
      case PropertyType.CHECKBOX: {
        controls[pk] = new UntypedFormControl(
          propValue || prop.defaultValue || false
        );
        break;
      }
      case PropertyType.DATE_TIME:
      case PropertyType.FILE:
      case PropertyType.LONG_TEXT:
      case PropertyType.NUMBER:
      case PropertyType.SHORT_TEXT: {
        if (prop.required) {
          validators.push(Validators.required);
        }
        if (typeof prop.defaultValue !== 'object') {
          const defaultValue = prop.defaultValue
            ? prop.defaultValue.toString()
            : '';
          controls[pk] = new UntypedFormControl(
            propValue ?? defaultValue,
            validators
          );
        } else {
          const defaultValue = prop.defaultValue
            ? prop.defaultValue.base64
            : '';
          controls[pk] = new UntypedFormControl(
            propValue ?? defaultValue,
            validators
          );
        }

        break;
      }
      case PropertyType.STATIC_DROPDOWN:
      case PropertyType.STATIC_MULTI_SELECT_DROPDOWN: {
        if (prop.required) {
          validators.push(Validators.required);
        }
        controls[pk] = new UntypedFormControl(
          propValue ?? prop.defaultValue,
          validators
        );
        break;
      }
      case PropertyType.DROPDOWN:
      case PropertyType.MULTI_SELECT_DROPDOWN: {
        if (prop.required) {
          validators.push(Validators.required);
        }
        controls[pk] = new UntypedFormControl(
          propValue ?? prop.defaultValue,
          validators
        );
        break;
      }
      case PropertyType.DYNAMIC: {
        const dynamicConfigControls: Record<string, UntypedFormControl> = {};
        if (propValue) {
          Object.keys(propValue).forEach((k) => {
            dynamicConfigControls[k] = new UntypedFormControl(
              (propValue as Record<string, unknown>)[k]
            );
          });
        } else {
          controls[pk] = new UntypedFormControl(
            propValue ?? (prop.defaultValue || '{}'),
            validators
          );
        }
        controls[pk] = fb.group(dynamicConfigControls);
        break;
      }
      case PropertyType.JSON: {
        if (prop.required) {
          validators.push(Validators.required);
        }
        if (!customizedInputs || !customizedInputs[pk]) {
          validators.push(jsonValidator);
        }
        if (typeof propValue === 'object') {
          controls[pk] = new UntypedFormControl(
            JSON.stringify(propValue, null, 2),
            validators
          );
        } else if (propValue) {
          controls[pk] = new UntypedFormControl(
            propertiesValues[pk],
            validators
          );
        } else {
          controls[pk] = new UntypedFormControl(
            prop.defaultValue ? JSON.stringify(prop.defaultValue, null, 2) : '',
            validators
          );
        }
        break;
      }
      default: {
        const exhaustiveCheck = prop;
        console.error(`Unhandled color case: ${exhaustiveCheck}`);
      }
    }
  });
  return controls;
}
