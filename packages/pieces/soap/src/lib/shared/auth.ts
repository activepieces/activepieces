import { PieceAuth, Property } from "@activepieces/pieces-framework";

export function soapAuth() {
    return PieceAuth.CustomAuth({
        displayName: 'Security',
        required: false,
        props: {
          type: Property.StaticDropdown({
            displayName: "Authentication Type",
            required: true,
            options: {
              options: [
                {
                  label: "WS Security",
                  value: "WS"
                },
                {
                  label: "Basic Auth",
                  value: "Basic"
                }
              ]
            }
          }),
          username: Property.ShortText({
            displayName: "Username",
            description: "The WS Security username",
            required: true
          }),
          password: Property.ShortText({
            displayName: "Password",
            description: "The WS Security password",
            required: true
          })
        }
      })
}