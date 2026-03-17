import { PieceAuth, Property } from "@activepieces/pieces-framework";

export const pcloudAuth = PieceAuth.OAuth2({
  description: "Authenticate with your pCloud account. **Important:** OAuth authorization and token URLs are hardcoded to US endpoints (my.pcloud.com / api.pcloud.com). EU users (eapi.pcloud.com) may need to register a US-region pCloud app or use an API key instead. The region selector below only affects API data calls, not the OAuth flow.",
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
