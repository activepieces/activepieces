import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { BettermodeAuthType } from "./auth";

type KeyValuePair = {[key: string]: string|boolean|undefined }

const bettermodeAPI = async (auth: BettermodeAuthType, query: string, variables: KeyValuePair = {}) => {
	const request: HttpRequest = {
		method  : HttpMethod.POST,
		url     : auth.region,
		headers : {
			'Content-Type'  : 'application/json',
			'Authorization' : auth.token ? `Bearer ${auth.token}` : undefined,
		},
		body    : JSON.stringify({
            query     : query,
            variables : variables
        }),
	};

	const response = await httpClient.sendRequest(request);
	return response.body;
}

const getGuestToken = async (auth: BettermodeAuthType) => {
	const query = `query GetGuestToken($domain: String!) {
		tokens(networkDomain: $domain) {
		  accessToken
		  role {
			name
			scopes
		  }
		  member {
			id
			name
		  }
		}
	}`;
	const variables = {
		domain: auth.domain,
	};
	const response = await bettermodeAPI(auth, query, variables);
	return response['body'].data.tokens.accessToken;
}

const getAuthToken = async (auth: BettermodeAuthType) => {
	const query = `mutation getAuthToken($email: String!, $password: String!) {
		loginNetwork(input:{usernameOrEmail: $email, password: $password}) {
			accessToken
			role {
				name
				scopes
			}
			member {
				id
				name
			}
		}
	}`;
	const variables = {
		email    : auth.email,
		password : auth.password,
	};
	auth.token = await getGuestToken(auth);
	const response = await bettermodeAPI(auth, query, variables);
	return response['body'].data.loginNetwork.accessToken;
}

export async function listSpaces(auth: BettermodeAuthType) {
	const query = `
    query GetUserInfo($userId: String!) {
        user(id: $userId) {
            name
            email
        }
    }
	`;
	const variables = {
		email    : auth.email,
		password : auth.password,
	};
	auth.token = await getAuthToken(auth);
	const response = await bettermodeAPI(auth, query, variables);
	return response["body"];
}


// postTypes
// memberSpaces
// createPost
// assignBadge