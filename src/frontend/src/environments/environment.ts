export const environment = {
	production: false,
	apiDomainUrl: 'localhost:8000',
	apiUrl: 'http://localhost:8000',
	jwtTokenName: 'token',
	stageName: 'stg',
	redirectUrl: 'http://localhost:8080/redirect',
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
