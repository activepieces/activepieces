import { GoogleAuth } from 'google-auth-library';

interface Credentials {
  client_email: string;
  private_key: string;
}

const parseServiceAccountCredentials = (
  serviceAccountCredentials: string
): Credentials => {
  const { client_email, private_key } = JSON.parse(serviceAccountCredentials);
  return { client_email, private_key };
};

export const createAuth = (serviceAccountCredentials: string) => {
  const { client_email, private_key } = parseServiceAccountCredentials(
    serviceAccountCredentials
  );
  return new GoogleAuth({
    credentials: { client_email, private_key },
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });
};

export const googleAuthCommon = {
  parseServiceAccountCredentials,
  createAuth,
};
