import { GoogleAuth } from 'google-auth-library';

function parseServiceAccountCredentials(serviceAccountCredentials: string) {
  const serviceAccountCredentialsJson = JSON.parse(serviceAccountCredentials);
  return {
    client_email: serviceAccountCredentialsJson.client_email,
    private_key: serviceAccountCredentialsJson.private_key,
  };
}

export function createAuth(serviceAccountCredentials: string) {
  const { client_email, private_key } = parseServiceAccountCredentials(
    serviceAccountCredentials
  );
  return new GoogleAuth({
    credentials: { client_email, private_key },
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });
}
