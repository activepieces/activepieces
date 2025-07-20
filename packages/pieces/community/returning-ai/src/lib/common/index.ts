export function getApiEndpoint(authToken?: string) {
  if (!authToken) return 'https://integration.returning.ai';

  if (authToken.includes('local:')) {
    return 'http://localhost:3333';
  } else if (authToken.includes('pre-staging:')) {
    return 'https://sgtr-integration.returning.ai';
  } else if (authToken.includes('staging:')) {
    return 'https://staging-integration.returning.ai';
  } else if (authToken.includes('playground:')) {
    return 'https://playground-integration.returning.ai';
  } else {
    return 'https://integration.returning.ai';
  }
}
