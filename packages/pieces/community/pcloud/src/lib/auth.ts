import { PieceAuth, Property } from "@activepieces/pieces-framework";

export const pcloudAuth = PieceAuth.OAuth2({
  description: "Authenticate with your pCloud account. Select your region (US or EU) based on where your account was registered.",
  authUrl: "https://my.pcloud.com/oauth2/authorize",
  tokenUrl: "https://api.pcloud.com/oauth2_token",
  required: true,
  scope: [],
  props: {
    region: Property.StaticDropdown({
      displayName: "Region",
      description: "Select US if your account is on api.pcloud.com, or EU if on eapi.pcloud.com.",
      required: true,
      defaultValue: "us",
      options: {
        options: [
          { label: "United States (api.pcloud.com)", value: "us" },
          { label: "Europe (eapi.pcloud.com)", value: "eu" },
        ],
      },
    }),
  },
});

export function getPcloudApiUrl(auth: any): string {
  const region = auth.props?.region ?? "us";
  return region === "eu" ? "https://eapi.pcloud.com" : "https://api.pcloud.com";
}
