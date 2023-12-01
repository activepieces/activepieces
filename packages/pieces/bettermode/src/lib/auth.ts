import { PieceAuth, Property, Validators } from "@activepieces/pieces-framework";
import { getLists } from "./api";

export type BettermodeAuthType = {domain: string, email: string, password: string}

export const sendyAuth = PieceAuth.CustomAuth({
    description: "Your domain should be the base URL of your Bettermode community. Example: https://community.example.com",
    props: {
        domain: Property.ShortText({
			displayName : 'BetterMode Domain',
			description : 'The domain of your Bettermode account',
			required    : true,
			validators: [Validators.url],
        }),
		email: Property.ShortText({
			displayName : 'Email',
			description : 'Email address for your Bettermode account',
			required    : true,
			validators: [Validators.email],
		}),
        password: PieceAuth.SecretText({
			displayName : 'Password',
			description : 'Password for your Bettermode account',
			required    : true,
			validators: [Validators.email],
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

const validateAuth = async (auth: BettermodeAuthType) => {
	const response = await getLists(auth);
	if (response.success !== true) {
		throw new Error('Authentication failed. Please check your domain and API key and try again.');
	}
}


function performGraphQLQuery(endpoint, query, variables = {}) {
    return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: query,
            variables: variables
        }),
    })
    .then(response => response.json())
    .then(data => data)
    .catch(error => console.error('Error:', error));
}

const endpoint = 'https://your-graphql-endpoint.com/graphql';
const query = `
    query GetUserInfo($userId: String!) {
        user(id: $userId) {
            name
            email
        }
    }
`;

// Example variables
const variables = { userId: '123' };

// Perform the query
performGraphQLQuery(endpoint, query, variables)
    .then(data => console.log(data));