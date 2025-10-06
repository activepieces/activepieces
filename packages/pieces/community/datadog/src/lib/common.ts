import { client } from '@datadog/datadog-api-client';

export type DatadogAuthType = {
  apiKey: string;
  appKey: string | undefined;
  site: string;
};

export const getDatadogConfiguration = (auth: DatadogAuthType) => {
  const configuration = client.createConfiguration(
    {authMethods: {
      apiKeyAuth: auth.apiKey,
      ...(auth.appKey ? {appKeyAuth: auth.appKey} : {}),
    }}
  );
  configuration.setServerVariables({
    site: auth.site
  });
  return configuration;
}

export const constructDatadogBaseUrl = (auth: DatadogAuthType, subdomain = 'api', version = 'v2') => {
  return `https://${subdomain}.${auth.site}/api/${version}`;
};

export const constructDatadogBaseHeaders = (auth: DatadogAuthType) => {
  return {
    'Accept': 'application/json',
    'DD-API-KEY': auth.apiKey,
    ...(auth.appKey ? {'DD-APP-KEY': auth.appKey} : {}),
  };
};
