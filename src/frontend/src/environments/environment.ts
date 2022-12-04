export const environment = {
	production: false,
	apiDomainUrl: 'stg-api.activepieces.com',
	apiUrl: 'https://stg-api.activepieces.com',
	jwtTokenName: 'token',
	stageName: 'stg',
	redirectUrl: 'https://stg-api.activepieces/redirect',
	appConnectors: 'https://cdn.activepieces.com/stg/connectors/app_connectors.json',
	userPropertyNameInLocalStorage: 'currentUser',
	feature: {
		newComponents: true,
		customRequest: true,
	},
};

/*
export const environment = {
	production: true,
	apiDomainUrl: 'localhost:8080',
	apiUrl: 'http://localhost:8080',
	jwtTokenName: 'token',
	stageName: 'dev',
	redirectUrl: 'http://localhost:4200/redirect',
	appConnectors: 'https://cdn.activepieces.com/stg/connectors/app_connectors.json',
	userPropertyNameInLocalStorage: 'currentUser',
  feature:{
    newComponents: true
  }
};
*/
