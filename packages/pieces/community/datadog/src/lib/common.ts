import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { client } from '@datadog/datadog-api-client';
import { datadogAuth } from '../..';


export const getDatadogConfiguration = (auth: AppConnectionValueForAuthProperty<typeof datadogAuth>) => {
  const configuration = client.createConfiguration(
    {authMethods: {
      apiKeyAuth: auth.props.apiKey,
      ...(auth.props.appKey ? {appKeyAuth: auth.props.appKey} : {}),
    }}
  );
  configuration.setServerVariables({
    site: auth.props.site
  });
  return configuration;
}

export const constructDatadogBaseUrl = (auth: AppConnectionValueForAuthProperty<typeof datadogAuth>, subdomain = 'api', version = 'v2') => {
  return `https://${subdomain}.${auth.props.site}/api/${version}`;
};

export const constructDatadogBaseHeaders = (auth: AppConnectionValueForAuthProperty<typeof datadogAuth>) => {
  return {
    'Accept': 'application/json', 
    'DD-API-KEY': auth.props.apiKey,
    ...(auth.props.appKey ? {'DD-APPLICATION-KEY': auth.props.appKey} : {}),
  };
};
