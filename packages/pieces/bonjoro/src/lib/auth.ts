import { PieceAuth, Validators } from "@activepieces/pieces-framework";
import { getCampaigns } from "./api";

export type BonjoroAuthType = {apiKey: string}

export const BonjoroAuth = PieceAuth.CustomAuth({
    description: "Authenticate with your Bonjoro account",
    props: {
        apiKey: PieceAuth.SecretText({
			displayName : 'API Key',
			description : 'The API key for your Bonjoro account',
			required    : true,
			validators: [Validators.pattern(/^[a-zA-Z0-9]+$/)],
        }),
    },
    validate: async ({ auth }) => {
		try {
			await validateAuth(auth);
			return {
				valid : true,
			};
		} catch (e) {
			return {
				valid : false,
				error : (e as Error)?.message
			};
		}
    },
    required : true
});

const validateAuth = async (auth: BonjoroAuthType) => {
	const response = await getCampaigns(auth);
	if (response.success !== true) {
		throw new Error('Authentication failed. Please check your domain and API key and try again.');
	}
}
