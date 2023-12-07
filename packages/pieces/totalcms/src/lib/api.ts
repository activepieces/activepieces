import { httpClient, HttpMethod, HttpRequest, QueryParams } from "@activepieces/pieces-common";
import { TotalCMSAuthType } from "./auth";

type KeyValuePair = {[key: string]: string|boolean|object|undefined }

const totalcmsAPI = async (
	auth   : TotalCMSAuthType,
	type   : string,
	slug   : string,
	query  : QueryParams = {},
	data   : KeyValuePair = {},
	method : HttpMethod = HttpMethod.GET,
) => {

	if (method === HttpMethod.GET) {
		query["slug"] = slug;
		query["type"] = type;
	} else {
		data["slug"] = slug;
		data["type"] = type;
	}

	const request: HttpRequest = {
		body        : data,
		queryParams : query,
		method      : method,
		url         : `${auth.domain}/rw_common/plugins/stacks/total-cms/totalapi.php`,
		headers     : {
			'Content-Type' : 'application/x-www-form-urlencoded',
			'total-key'    : auth.license,
		},
	};
	const response = await httpClient.sendRequest(request);

	if (response.status !== 200) {
		throw new Error(`Total CMS API error: ${response.status} ${response.body}`);
	}

	return {
		success : true,
		data    : response.body['data'],
	};
}

export async function saveContent(auth: TotalCMSAuthType, type: string, slug: string, data: KeyValuePair) {
	return totalcmsAPI(auth, type, slug, {}, data, HttpMethod.POST);
}

export async function getContent(auth: TotalCMSAuthType, type: string, slug: string, query: QueryParams = {}) {
	return totalcmsAPI(auth, type, slug, query);
}

export async function getBlogPost(auth: TotalCMSAuthType, slug: string, permalink: string) {
	return totalcmsAPI(auth, 'blog', slug, {permalink : permalink});
}
