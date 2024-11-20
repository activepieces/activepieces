    import { createCustomApiCallAction } from "@activepieces/pieces-common";
    import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
    import { generateRazorpayAuthHeader, RazorpayCredentials, razorpayURL } from "./lib/common/utils";
    import { createPaymentlink } from "./lib/actions/create-payment-link";

    export const razorpayAuth = PieceAuth.CustomAuth({
      description: `
          Enter your Key ID and Key Secret

          Login to your Dashboard with appropriate credentials.
          Select the mode (Test or Live) for which you want to generate the API key
          Navigate to Settings > API Keys > Generate Key to generate keys for the selected mode.

          The Key ID and Key Secret appear in a pop-out window.
        `,
      required: true,
      props: {
          keyID: Property.ShortText({
            displayName: 'Key ID',
            required: true,
          }),
          keySecret: PieceAuth.SecretText({
            displayName: 'Key Secret',
            required: true,
          }),
      }
  })
    
    export const razorpay = createPiece({
      displayName: "Razorpay",
      auth: razorpayAuth,
      minimumSupportedRelease: '0.30.0',
      logoUrl: "https://cdn.activepieces.com/pieces/razorpay.png",
      authors: ['drona2938'],
      actions: [
        createCustomApiCallAction({
          baseUrl: () => razorpayURL.apiURL,
          auth: razorpayAuth,
          authMapping: (auth) => generateRazorpayAuthHeader(auth as RazorpayCredentials),
        }),
        createPaymentlink
      ],
      triggers: [],
    });
    