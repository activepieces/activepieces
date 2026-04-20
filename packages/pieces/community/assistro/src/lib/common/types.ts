export type MediaItem = {
	media_base64: string;
	file_name: string;
};

export type WhatsAppMessage = {
	number: string;
	message: string;
	type: number;
	media?: MediaItem[];
};