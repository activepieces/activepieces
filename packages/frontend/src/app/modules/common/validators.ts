import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function containsSpecialCharacter(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const specialCharacterRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
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

export function phoneNumberValidation(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // using complex regex, It will fail for a lot of cases such as germany number,
    // as this will make them feels bad and try to find way around
    // let just trust the user.
    const phoneNumberRegex = /^[\+]?[0-9\(\)]{5,18}$/;
    if (!control.value) return null;
    if (!phoneNumberRegex.test(control.value)) {
      return { invalidNumber: true };
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
