import { Property } from "@activepieces/framework";

export const sendInBluePropsContactsProps = {
  api_key: Property.SecretText({
    displayName: "Project API key",
    description: "Your project API key",
    required: true
  })
}