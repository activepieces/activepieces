const MIN_LENGTH = 8;
const MAX_LENGTH = 64;
const SPECIAL_CHARACTER_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
const LOWERCASE_REGEX = /[a-z]/;
const UPPERCASE_REGEX = /[A-Z]/;
const NUMBER_REGEX = /[0-9]/;

type ValidationRule = {
  label: string;
  condition: boolean;
};

const validationMessages = {
  minLength: `Password must be at least ${MIN_LENGTH} characters long`,
  maxLength: `Password can't be more than ${MAX_LENGTH} characters long`,
  specialCharacter: 'Password must contain at least one special character',
  lowercase: 'Password must contain at least one lowercase letter',
  uppercase: 'Password must contain at least one uppercase letter',
  number: 'Password must contain at least one number',
};

const generatePasswordValidation = (password: string) => {
  const rules: ValidationRule[] = [
    {
      label: '8-64 Characters',
      condition: password.length >= MIN_LENGTH && password.length <= MAX_LENGTH,
    },
    {
      label: 'Special Character',
      condition: SPECIAL_CHARACTER_REGEX.test(password),
    },
    { label: 'Lowercase', condition: LOWERCASE_REGEX.test(password) },
    { label: 'Uppercase', condition: UPPERCASE_REGEX.test(password) },
    { label: 'Number', condition: NUMBER_REGEX.test(password) },
  ];

  const formValidationObject = {
    minLength: {
      value: MIN_LENGTH,
      message: validationMessages.minLength,
    },
    maxLength: {
      value: MAX_LENGTH,
      message: validationMessages.maxLength,
    },
    pattern: {
      value: SPECIAL_CHARACTER_REGEX,
      message: validationMessages.specialCharacter,
    },
    validate: {
      hasLowercaseCharacter: (value: string) =>
        LOWERCASE_REGEX.test(value) || validationMessages.lowercase,
      hasUppercaseCharacter: (value: string) =>
        UPPERCASE_REGEX.test(value) || validationMessages.uppercase,
      hasNumber: (value: string) =>
        NUMBER_REGEX.test(value) || validationMessages.number,
    },
  };

  return { rules, formValidationObject };
};

export { generatePasswordValidation };
