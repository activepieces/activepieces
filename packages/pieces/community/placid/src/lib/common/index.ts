export const PLACID_BASE_URL = 'https://api.placid.app/api/rest';

export type PlacidRenderType = 'image' | 'pdf' | 'video';

export type PlacidLayerValues = Record<string, unknown>;

export type PlacidLayers = Record<string, PlacidLayerValues>;

export interface PlacidLayer {
	name: string;
	type: string;
}

export interface PlacidTemplate {
	uuid: string;
	title: string;
	thumbnail?: string | null;
	width?: number;
	height?: number;
	tags?: string[];
	custom_data?: unknown;
	collections?: unknown[];
	layers?: PlacidLayer[];
}

export interface PlacidRenderErrorDetail {
	layer?: string;
	message?: string;
}

export interface PlacidRender {
	id: number | string;
	status: 'queued' | 'finished' | 'error';
	image_url?: string | null;
	pdf_url?: string | null;
	video_url?: string | null;
	polling_url?: string;
	error_code?: string | null;
	error_message?: string | null;
	error_details?: PlacidRenderErrorDetail[] | null;
	passthrough?: unknown;
}

export interface PlacidCollection {
	id: number | string;
	title?: string;
	templates?: unknown[];
	template_uuids?: unknown[];
}

export interface PlacidImageModifications {
	width?: number;
	height?: number;
	filename?: string;
	image_format?: string;
	dpi?: number;
	color_mode?: string;
}

export interface PlacidPdfModifications {
	filename?: string;
	image_quality?: string;
	dpi?: number;
	color_mode?: string;
}

export interface PlacidVideoModifications {
	width?: number;
	height?: number;
	filename?: string;
	canvas_background?: string;
	fps?: number;
}

export interface PlacidCreateImageRequest {
	template_uuid: string;
	layers?: PlacidLayers;
	modifications?: PlacidImageModifications;
	webhook_success?: string;
	create_now?: boolean;
	passthrough?: string;
}

export interface PlacidTemplatePart {
	template_uuid: string;
	layers?: PlacidLayers;
}

export interface PlacidCreatePdfRequest {
	pages: PlacidTemplatePart[];
	modifications?: PlacidPdfModifications;
	webhook_success?: string;
	create_now?: boolean;
	passthrough?: string;
}

export interface PlacidCreateVideoRequest {
	clips: PlacidTemplatePart[];
	modifications?: PlacidVideoModifications;
	webhook_success?: string;
	create_now?: boolean;
	passthrough?: string;
}
