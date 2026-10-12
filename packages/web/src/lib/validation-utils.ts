import { AxiosError } from 'axios';

export const validationUtils = {
  isValidationError: (
    error: unknown,
  ): error is AxiosError<{ code?: string; params?: { message?: string } }> => {
    return (
      error instanceof AxiosError &&
      error.response?.status === 409 &&
      error.response?.data?.code === 'VALIDATION'
    );
  },
};
