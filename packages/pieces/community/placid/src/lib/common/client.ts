import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
	PLACID_BASE_URL,
	PlacidTemplate,
	PlacidImage,
	PlacidCreateImageRequest,
	PlacidCreatePdfRequest,
	PlacidCreateVideoRequest,
} from './index';

export class PlacidClient {
	constructor(private apiKey: string) {}

	async listTemplates(): Promise<PlacidTemplate[]> {
		const templates = [];
		let nextUrl: string | undefined = `${PLACID_BASE_URL}/templates`;

		do {
			const response = await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: nextUrl,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: this.apiKey,
				},
			});

			const { data, links } = response.body as { data: PlacidTemplate[]; links: { next?: string } };
			templates.push(...data);

			nextUrl = links.next;
		} while (nextUrl);

		return templates;
	}

	async getTemplate(templateId: string): Promise<PlacidTemplate> {
		const response = await httpClient.sendRequest<PlacidTemplate>({
			method: HttpMethod.GET,
			url: `${PLACID_BASE_URL}/templates/${templateId}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: this.apiKey,
			},
		});

		return response.body;
	}

	async createImage(request: PlacidCreateImageRequest): Promise<PlacidImage> {
		const response = await httpClient.sendRequest<PlacidImage>({
			method: HttpMethod.POST,
			url: `${PLACID_BASE_URL}/images`,
			body: request,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: this.apiKey,
			},
		});

		const result = response.body;

		// If create_now is true, poll until completion
		if (request.create_now && result.status === 'queued') {
			return await this.pollForCompletion(result.id, 'image');
		}

		return result;
	}

	async getImage(imageId: string): Promise<PlacidImage> {
		try {
			const response = await httpClient.sendRequest<PlacidImage>({
				method: HttpMethod.GET,
				url: `${PLACID_BASE_URL}/images/${imageId}`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: this.apiKey,
				},
			});
			return response.body;
		} catch (error: any) {
			if (error.response?.status === 404) {
				throw new Error(
					`Image with ID ${imageId} not found. Please verify the image ID exists in your Placid account.`,
				);
			}
			if (error.response?.status === 403) {
				throw new Error(
					`Access forbidden for image ID ${imageId}. This image may not belong to your account or may have been deleted.`,
				);
			}
			if (error.response?.status === 500) {
				throw new Error(
					`Server error while retrieving image ID ${imageId}. Please try again later or contact support.`,
				);
			}
			throw error;
		}
	}

	async deleteImage(imageId: string): Promise<void> {
		await httpClient.sendRequest({
			method: HttpMethod.DELETE,
			url: `${PLACID_BASE_URL}/images/${imageId}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: this.apiKey,
			},
		});
	}

	async createPdf(request: PlacidCreatePdfRequest): Promise<PlacidImage> {
		const response = await httpClient.sendRequest<PlacidImage>({
			method: HttpMethod.POST,
			url: `${PLACID_BASE_URL}/pdfs`,
			body: request,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: this.apiKey,
			},
		});

		const result = response.body;

		// If create_now is true, poll until completion
		if (request.create_now && result.status === 'queued') {
			return await this.pollForCompletion(result.id, 'pdf');
		}

		return result;
	}

	async createVideo(request: PlacidCreateVideoRequest): Promise<PlacidImage> {
		const response = await httpClient.sendRequest<PlacidImage>({
			method: HttpMethod.POST,
			url: `${PLACID_BASE_URL}/videos`,
			body: request,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: this.apiKey,
			},
		});

		const result = response.body;

		// If create_now is true, poll until completion
		if (request.create_now && result.status === 'queued') {
			return await this.pollForCompletion(result.id, 'video');
		}

		return result;
	}

	async pollForCompletion(id: string, type: 'image' | 'pdf' | 'video'): Promise<PlacidImage> {
		const maxAttempts = 30; // 5 minutes max (10 second intervals)
		const interval = 10000; // 10 seconds

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			try {
				// Wait before polling (except first attempt)
				if (attempt > 0) {
					await new Promise((resolve) => setTimeout(resolve, interval));
				}

				// Get current status
				let result: PlacidImage;
				switch (type) {
					case 'image':
						result = await this.getImage(id);
						break;
					case 'pdf':
						result = await this.getPdf(id);
						break;
					case 'video':
						result = await this.getVideo(id);
						break;
				}

				// Check if completed
				if (result.status === 'finished') {
					return result;
				}

				// Check if failed
				if (result.status === 'error') {
					throw new Error(`${type} generation failed: ${result.error_message || 'Unknown error'}`);
				}

				// Continue polling if still queued/processing
			} catch (error) {
				// If it's the last attempt, throw the error
				if (attempt === maxAttempts - 1) {
					throw new Error(`Polling timeout: ${type} generation took too long`);
				}
				// Otherwise, continue polling
			}
		}

		throw new Error(`Polling timeout: ${type} generation took too long`);
	}

	async getPdf(pdfId: string): Promise<PlacidImage> {
		try {
			const response = await httpClient.sendRequest<PlacidImage>({
				method: HttpMethod.GET,
				url: `${PLACID_BASE_URL}/pdfs/${pdfId}`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: this.apiKey,
				},
			});
			return response.body;
		} catch (error: any) {
			if (error.response?.status === 404) {
				throw new Error(
					`PDF with ID ${pdfId} not found. Please verify the PDF ID exists in your Placid account.`,
				);
			}
			if (error.response?.status === 403) {
				throw new Error(
					`Access forbidden for PDF ID ${pdfId}. This PDF may not belong to your account or may have been deleted.`,
				);
			}
			if (error.response?.status === 500) {
				throw new Error(
					`Server error while retrieving PDF ID ${pdfId}. Please try again later or contact support.`,
				);
			}
			throw error;
		}
	}

	async getVideo(videoId: string): Promise<PlacidImage> {
		try {
			const response = await httpClient.sendRequest<PlacidImage>({
				method: HttpMethod.GET,
				url: `${PLACID_BASE_URL}/videos/${videoId}`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: this.apiKey,
				},
			});
			return response.body;
		} catch (error: any) {
			if (error.response?.status === 404) {
				throw new Error(
					`Video with ID ${videoId} not found. Please verify the video ID exists in your Placid account.`,
				);
			}
			if (error.response?.status === 403) {
				throw new Error(
					`Access forbidden for video ID ${videoId}. This video may not belong to your account or may have been deleted.`,
				);
			}
			if (error.response?.status === 500) {
				throw new Error(
					`Server error while retrieving video ID ${videoId}. Please try again later or contact support.`,
				);
			}
			throw error;
		}
	}
}
