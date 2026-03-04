import { t } from 'i18next';

const MIN_LENGTH = 8;
const MAX_LENGTH = 64;
const SPECIAL_CHARACTER_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
const LOWERCASE_REGEX = /[a-z]/;
const UPPERCASE_REGEX = /[A-Z]/;
const NUMBER_REGEX = /[0-9]/;

type ValidationRule = {
  label: string;
  condition: (password: string) => boolean;
};

const validationMessages = {
  minLength: t(`Password must be at least ${MIN_LENGTH} characters long`),
  maxLength: t(`Password can't be more than ${MAX_LENGTH} characters long`),
  specialCharacter: t('Password must contain at least one special character'),
  lowercase: t('Password must contain at least one lowercase letter'),
  uppercase: t('Password must contain at least one uppercase letter'),
  number: t('Password must contain at least one number'),
};

const passwordRules: ValidationRule[] = [
  {
    label: t('8-64 Characters'),
    condition: (password: string) =>
      password.length >= MIN_LENGTH && password.length <= MAX_LENGTH,
  },
  {
    label: t('Special Character'),
    condition: (password: string) => SPECIAL_CHARACTER_REGEX.test(password),
  },
  {
    label: t('Lowercase'),
    condition: (password: string) => LOWERCASE_REGEX.test(password),
  },
  {
    label: t('Uppercase'),
    condition: (password: string) => UPPERCASE_REGEX.test(password),
  },
  {
    label: t('Number'),
    condition: (password: string) => NUMBER_REGEX.test(password),
  },
];

const passwordValidation = {
  hasSpecialCharacter: (value: string) =>
    SPECIAL_CHARACTER_REGEX.test(value) || validationMessages.specialCharacter,
  minLength: (value: string) =>
    value.length >= MIN_LENGTH || validationMessages.minLength,
  maxLength: (value: string) =>
    value.length <= MAX_LENGTH || validationMessages.maxLength,
  hasLowercaseCharacter: (value: string) =>
    LOWERCASE_REGEX.test(value) || validationMessages.lowercase,
  hasUppercaseCharacter: (value: string) =>
    UPPERCASE_REGEX.test(value) || validationMessages.uppercase,
  hasNumber: (value: string) =>
    NUMBER_REGEX.test(value) || validationMessages.number,
};

export { passwordValidation, passwordRules };
