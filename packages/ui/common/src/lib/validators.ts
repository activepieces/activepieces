import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function containsSpecialCharacter(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const specialCharacterRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
    if (!control.value || !specialCharacterRegex.test(control.value)) {
      return { specialCharacter: true };
    }
    return null;
  };
}
export function containsLowercaseCharacter(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const lowercaseCharacterRegex = /[a-z]/;
    if (!control.value || !lowercaseCharacterRegex.test(control.value)) {
      return { lowercase: true };
    }
    return null;
  };
}
export function containsUppercaseCharacter(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const uppsercaseCharacterRegex = /[A-Z]/;
    if (!control.value || !uppsercaseCharacterRegex.test(control.value)) {
      return { uppercase: true };
    }
    return null;
  };
}

export function containsNumber(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const numberRegex = /[0-9]/;
    if (!control.value || !numberRegex.test(control.value)) {
      return { number: true };
    }
    return null;
  };
}
export function checkboxIsTrue(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return { checkBoxMustBeTrue: true };
    }
    return null;
  };
}
