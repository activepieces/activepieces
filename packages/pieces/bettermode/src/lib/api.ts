import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { BettermodeAuthType } from "./auth";

type KeyValuePair = {[key : string] : string|boolean|undefined }

const bettermodeAPI = async (
	auth      : BettermodeAuthType,
	query     : string,
	variables : KeyValuePair = {}
) => {
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
	return response.body["data"];
}

const getGuestToken = async (auth: BettermodeAuthType) => {
	const query = `query GetGuestToken($domain: String!) {
		tokens(networkDomain: $domain) {
			accessToken
		}
	}`;

	const variables = { domain : auth.domain };
	const response  = await bettermodeAPI(auth, query, variables);

	auth.token = response.tokens.accessToken;

	return auth;
}

export const getAuthToken = async (auth: BettermodeAuthType) => {
	const query = `mutation getAuthToken($email: String!, $password: String!) {
		loginNetwork(input:{usernameOrEmail: $email, password: $password}) {
			accessToken
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

	auth = await getGuestToken(auth);
	const response = await bettermodeAPI(auth, query, variables);

	auth.token = response.loginNetwork.accessToken;
	auth.memberId = response.loginNetwork.member.id;

	return auth;
}

const getPostType = async (auth: BettermodeAuthType, postTypeName: string) => {
	const query = `query getPostType($postTypeName: String!) {
		postTypes(limit: 1, query: $postTypeName) {
			nodes {
				id
				name
			}
		}
	}`;

	if (!auth.memberId) auth = await getAuthToken(auth);

	const variables = { postTypeName : postTypeName };
	const response  = await bettermodeAPI(auth, query, variables);

	return response.postTypes.nodes[0];
}

export const listMemberSpaces = async (auth: BettermodeAuthType) => {
	const query = `query listMemberSpaces($memberId: String!) {
		spaces(memberId: $memberId, limit: 100) {
			nodes {
				id
				name
			}
		}
	}`;

	if (!auth.memberId) auth = await getAuthToken(auth);

	const variables = { memberId : auth.memberId };
	const response  = await bettermodeAPI(auth, query, variables);

	return response.spaces.nodes;
}

export const createPostOfType = async(
	auth         : BettermodeAuthType,
	postTypeName : string,
	spaceId      : string,
	tagNames     : string,
	title        : string,
	content      : string,
	locked = false
) => {
	const query = `mutation {
		createPost(
		  	spaceId : $spaceId,
			input : {
				postTypeId    : $postTypeId,
				locked        : $locked,
				publish       : true,
				tagNames      : $tagNames,
				mappingFields : [
				{
					key   : "title",
					type  : text,
					value : $title
				},
				{
					key   : "content",
					type  : html,
					value : $content
				}
				]
			}
		) {
			url
		}
	}`;

	auth = await getAuthToken(auth);

	const postType = await getPostType(auth, postTypeName);

	const variables = {
		spaceId    : spaceId,
		postTypeId : postType.id,
		locked     : locked,
		tagNames   : tagNames,
		title      : title,
		content    : content,
	};
	const response = await bettermodeAPI(auth, query, variables);
	return response.createPost.url;
}

export const createDiscussion = async (
	auth         : BettermodeAuthType,
	spaceId      : string,
	tagNames     : string,
	title        : string,
	content      : string,
	locked = false
) => {
	return await createPostOfType(auth, 'Discussion', spaceId, tagNames, title, content, locked);
}

export const createQuestion = async (
	auth         : BettermodeAuthType,
	spaceId      : string,
	tagNames     : string,
	title        : string,
	content      : string,
	locked = false
) => {
	return await createPostOfType(auth, 'Question', spaceId, tagNames, title, content, locked);
}

// TODO: assignBadge to member