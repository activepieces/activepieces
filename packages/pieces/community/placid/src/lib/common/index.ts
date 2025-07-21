export const PLACID_BASE_URL = 'https://api.placid.app/api/rest';

export interface PlacidTemplate {
	uuid: string;
	title: string;
	thumbnail?: string;
	width?: number;
	height?: number;
	tags?: string[];
	custom_data?: any;
	collections?: any[];
	layers: PlacidLayer[];
}

export interface PlacidLayer {
	name: string;
	type: 'text' | 'picture' | 'shape' | 'browserframe' | 'subtitle' | 'barcode' | 'rating';
}

export interface PlacidImage {
	id: string;
	status: 'queued' | 'finished' | 'error';
	image_url?: string;
	polling_url: string;
	error_message?: string;
}

export interface PlacidCreateImageRequest {
	template_uuid: string;
	layers?: Record<string, any>;
	modifications?: {
		width?: number;
		height?: number;
		filename?: string;
		dpi?: number;
	};
	webhook_success?: string;
	create_now?: boolean;
	passthrough?: Record<string, any> | string;
}

export interface PlacidCreatePdfRequest {
	pages: Array<{
		template_uuid: string;
		layers?: Record<string, any>;
	}>;
	modifications?: {
		filename?: string;
		quality?: number;
		dpi?: number;
	};
	webhook_success?: string;
	create_now?: boolean;
	passthrough?: Record<string, any> | string;
}

export interface PlacidCreateVideoRequest {
	clips: Array<{
		template_uuid: string;
		layers?: Record<string, any>;
	}>;
	modifications?: {
		width?: number;
		height?: number;
		filename?: string;
		canvas_background?: string;
		fps?: number;
	};
	webhook_success?: string;
	create_now?: boolean;
	passthrough?: Record<string, any> | string;
}

export interface PlacidWebhookPayload {
	id: string;
	status: string;
	image_url?: string;
	template_uuid: string;
	passthrough?: Record<string, any>;
}
