import {AuthenticationType} from '../../../common/authentication/core/authentication-type';
import {httpClient} from '../../../common/http/core/http-client';
import {HttpMethod} from '../../../common/http/core/http-method';
import type {HttpRequest} from '../../../common/http/core/http-request';

type AppendGoogleSheetValuesParams = {
	values: string[];
	spreadSheetId: string;
	range: string;
	valueInputOption: ValueInputOption;
	majorDimension: Dimension;
	accessToken: string;
};

export async function appendGoogleSheetValues(params: AppendGoogleSheetValuesParams) {
	const requestBody = {
		majorDimension: params.majorDimension,
		range: params.range,
		values: params.values.map(val => ({values: val})),
	};
	const request: HttpRequest<typeof requestBody> = {
		method: HttpMethod.POST,
		url: `https://sheets.googleapis.com/v4/spreadsheets/${params.spreadSheetId}/values/${params.range}:append`,
		body: requestBody,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: params.accessToken,
		},
		queryParams: {
			valueInputOption: params.valueInputOption,
		},
	};

	return httpClient.sendRequest(request);
}

export enum ValueInputOption 	{
	RAW = 'RAW',
	USER_ENTERED = 'USER_ENTERED',
}

export enum Dimension 	{
	ROWS = 'ROWS',
	COLUMNS = 'COLUMNS',
}