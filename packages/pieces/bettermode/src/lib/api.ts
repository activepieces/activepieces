import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { BettermodeAuthType } from "./auth";

type KeyValuePair = {[key: string]: string|boolean|undefined }

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