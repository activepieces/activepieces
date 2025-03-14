export function getApiEndpoint(authToken?: string) {
  if (!authToken) return 'https://integration.genesiv.com';

  if (authToken.includes('local:')) {
    return 'http://localhost:3333';
  } else if (authToken.includes('pre-staging:')) {
    return 'https://sgtr-integration.genesiv.org';
  } else if (authToken.includes('staging:')) {
    return 'https://staging-integration.genesiv.org';
  } else if (authToken.includes('playground:')) {
    return 'https://playground-integration.genesiv.org';
  } else {
    return 'https://integration.genesiv.com';
  }
}
