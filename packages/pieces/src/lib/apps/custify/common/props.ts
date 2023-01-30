import { Property } from "../../../framework/property";

export const custifyAuthentication = Property.SecretText({
  displayName: 'API Key',
  required: true,
});
