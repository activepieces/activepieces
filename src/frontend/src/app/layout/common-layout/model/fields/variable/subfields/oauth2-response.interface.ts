export interface OAuth2Response {
	access_token: string;
	refresh_token: string;
	expire_in: number;
	token_type: string;
	auth_response: any;
}
