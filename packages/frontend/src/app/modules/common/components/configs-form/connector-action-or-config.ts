import { PropertyType } from "packages/pieces/src/lib/framework/property";


export enum HttpMethod {
	CONNECT = 'CONNECT',
	DELETE = 'DELETE',
	GET = 'GET',
	HEAD = 'HEAD',
	OPTIONS = 'OPTIONS',
	PATCH = 'PATCH',
	POST = 'POST',
	PUT = 'PUT',
	TRACE = 'TRACE',
}

export interface PieceConfig {
	key: string;
	type: PropertyType;
	label: string;
	value?: any;
	description?: string;
	authUrl?: string;
	tokenUrl?: string;
	redirectUrl?: string;
	scope?: string[];
	required: boolean;
	extra?: Record<string, unknown>;
	refreshers?: string[];
	basicAuthConfigs?: {
		password: Pick<PieceProperty, "required" | "displayName" | "description">,
		username: Pick<PieceProperty, "required" | "displayName" | "description">,
	}
}

export class PieceProperty {
	name: string;
	description: string;
	type: PropertyType;
	required: boolean;
	displayName: string;
	authUrl?: string;
	tokenUrl?: string;
	scope?: string[];
	extra?: Record<string, unknown>;
	refreshers?: string[];
	password?: PieceProperty
	username?: PieceProperty
}



export const propsConvertor = {
	convertToFrontEndConfig: (name: string, prop: PieceProperty): PieceConfig => {
		const pieceConfig: PieceConfig = {
			key: name,
			type: prop.type,
			label: prop.displayName,
			description: prop.description,
			authUrl: prop.authUrl,
			tokenUrl: prop.tokenUrl,
			scope: prop.scope,
			required: prop.required,
			extra: prop.extra,
			refreshers: prop.refreshers,

		};
		if (prop.username && prop.password) {
			pieceConfig.basicAuthConfigs = {
				password: prop.password,
				username: prop.username
			}
		}
		return pieceConfig;
	},
};

export interface AppPiece {
	name: string;
	logoUrl: string;
	actions: propMap;
	triggers: propMap;
	displayName: string;
	description?: string;
}

type propMap = Record<
	string,
	{
		displayName: string;
		description: string;
		props: Record<string, PieceProperty>;
		sampleData?: Object;
	}
>;
