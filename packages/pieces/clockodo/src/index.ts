import { AuthProp, Piece, Property } from "@activepieces/pieces-framework";

export const clockodo = Piece.create({
  displayName: "Clockodo",
  logoUrl: "https://cdn.activepieces.com/pieces/clockodo.png",
  authors: ["JanHolger"],
  auth: AuthProp.CustomAuth({
    required: true,
    props: {
      email: Property.ShortText({
        displayName: 'E-Mail',
        required: true,
        description: "The email of your clockodo user"
      }),
      token: AuthProp.SecretText({
        displayName: 'API-Token',
        description: "Your api token (can be found in profile settings)",
        required: true,
      }),
      company_name: Property.ShortText({
        displayName: 'Company Name',
        description: "Your company name or app name",
        required: true,
      }),
      company_email: Property.ShortText({
        displayName: 'Company E-Mail',
        description: "A contact email for your company or app",
        required: true,
      })
    }
  }),
});
