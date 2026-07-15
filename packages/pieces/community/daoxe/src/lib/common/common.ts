export const DEFAULT_BASE_URL = 'https://daoxe.com/v1';

export const getUnauthorizedMessage = (baseUrl: string) =>
  `Error Occurred: 401
Ensure that your DaoXE API key is valid and that the base URL is ${baseUrl} (or your gateway URL).
`;

/** @deprecated Prefer getUnauthorizedMessage(baseUrl) so custom base URLs appear correctly. */
export const unauthorizedMessage = getUnauthorizedMessage(DEFAULT_BASE_URL);
