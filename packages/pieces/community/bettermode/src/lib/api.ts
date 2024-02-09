import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { BettermodeAuthType } from './auth';

type KeyValuePair = { [key: string]: string | boolean | object | undefined };

const bettermodeAPI = async (
  auth: BettermodeAuthType,
  query: string,
  variables: KeyValuePair = {}
) => {
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: auth.region,
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth.token ? `Bearer ${auth.token}` : undefined,
    },
    body: JSON.stringify({
      query: query,
      variables: variables,
    }),
  };

  const response = await httpClient.sendRequest(request);

  if (response.body['errors']) {
    throw new Error(response.body['errors'][0]['message']);
  }

  return response.body['data'];
};

const getGuestToken = async (auth: BettermodeAuthType) => {
  const query = `query GetGuestToken($domain: String!) {
		tokens(networkDomain: $domain) {
			accessToken
		}
	}`;

  const variables = { domain: auth.domain };
  const response = await bettermodeAPI(auth, query, variables);

  auth.token = response.tokens.accessToken;

  return auth;
};

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
    email: auth.email,
    password: auth.password,
  };

  auth = await getGuestToken(auth);
  const response = await bettermodeAPI(auth, query, variables);

  auth.token = response.loginNetwork.accessToken;
  auth.memberId = response.loginNetwork.member.id;

  return auth;
};

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

  const variables = { postTypeName: postTypeName };
  const response = await bettermodeAPI(auth, query, variables);

  return response.postTypes.nodes[0];
};

export const listBadges = async (auth: BettermodeAuthType) => {
  const query = `query {
		network {
			badges {
				id
				name
			}
		}
	}`;

  if (!auth.memberId) auth = await getAuthToken(auth);

  const response = await bettermodeAPI(auth, query);

  return response.network.badges;
};

export const listMemberSpaces = async (auth: BettermodeAuthType) => {
  const query = `query listMemberSpaces($memberId: ID!) {
		spaces(memberId: $memberId, limit: 100) {
			nodes {
				id
				name
			}
		}
	}`;

  if (!auth.memberId) auth = await getAuthToken(auth);

  const variables = { memberId: auth.memberId };
  const response = await bettermodeAPI(auth, query, variables);

  return response.spaces.nodes;
};

const getMemberByEmail = async (auth: BettermodeAuthType, email: string) => {
  const query = `query getMemberId($email: String!) {
        members(limit: 1, query: $email) {
            nodes {
                id
                name
            }
        }
	}`;

  if (!auth.memberId) auth = await getAuthToken(auth);

  const variables = { email: email };
  const response = await bettermodeAPI(auth, query, variables);

  if (response.members.nodes.length == 0) {
    throw new Error(`Member with email ${email} not found`);
  }

  return response.members.nodes[0];
};

export const assignBadgeToMember = async (
  auth: BettermodeAuthType,
  badgeId: string,
  email: string
) => {
  const query = `mutation assignBadgeToMember($badgeId: String!, $memberId: String!) {
		assignBadge(
			id: $badgeId,
			input: {
				memberId: $memberId,
			}
		) {
			status
		}
	}`;

  if (!auth.memberId) auth = await getAuthToken(auth);

  const member = await getMemberByEmail(auth, email);
  const variables = { badgeId: badgeId, memberId: member.id };
  const response = await bettermodeAPI(auth, query, variables);

  return response.assignBadge;
};

export const revokeBadgeFromMember = async (
  auth: BettermodeAuthType,
  badgeId: string,
  email: string
) => {
  const query = `mutation revokeBadgeFromMember($badgeId: String!, $memberId: String!) {
		revokeBadge(
			id: $badgeId,
			input: {
				memberId: $memberId,
			}
		) {
			status
		}
	}`;

  if (!auth.memberId) auth = await getAuthToken(auth);

  const member = await getMemberByEmail(auth, email);
  const variables = { badgeId: badgeId, memberId: member.id };
  const response = await bettermodeAPI(auth, query, variables);

  return response.revokeBadge;
};

export const createPostOfType = async (
  auth: BettermodeAuthType,
  postTypeName: string,
  spaceId: string,
  tagNames: string,
  title: string,
  content: string,
  locked = false
) => {
  const query = `mutation createPostOfType($spaceId: ID!, $postTypeId: String!, $locked: Boolean!, $tagNames: [String!], $title: String!, $content: String!) {
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
			createdAt
		}
	}`;

  auth = await getAuthToken(auth);

  const postType = await getPostType(auth, postTypeName);

  const variables = {
    spaceId: spaceId,
    postTypeId: postType.id,
    locked: locked,
    tagNames: tagNames.split(',').map((tag: string) => tag.trim()),
    title: JSON.stringify(title),
    content: JSON.stringify(content),
  };
  const response = await bettermodeAPI(auth, query, variables);
  return response.createPost;
};

export const createDiscussion = async (
  auth: BettermodeAuthType,
  spaceId: string,
  tagNames: string,
  title: string,
  content: string,
  locked = false
) => {
  return await createPostOfType(
    auth,
    'Discussion',
    spaceId,
    tagNames,
    title,
    content,
    locked
  );
};

export const createQuestion = async (
  auth: BettermodeAuthType,
  spaceId: string,
  tagNames: string,
  title: string,
  content: string,
  locked = false
) => {
  return await createPostOfType(
    auth,
    'Question',
    spaceId,
    tagNames,
    title,
    content,
    locked
  );
};

// TODO: assignBadge to member
