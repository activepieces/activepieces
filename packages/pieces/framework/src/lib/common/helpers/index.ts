import { OAuth2PropertyValue } from "../../framework/property";

export const getAccessTokenOrThrow = (auth: OAuth2PropertyValue | undefined): string => {
  const accessToken = auth?.access_token;

  if (accessToken === undefined) {
    throw new Error("Invalid bearer token");
  }

  return accessToken;
};
