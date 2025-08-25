export class VimeoClient {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async makeRequest(url: string, options: RequestInit = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`Vimeo API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async getUserInfo() {
        return this.makeRequest('https://api.vimeo.com/me');
    }

    async searchVideos(query: string, sort: string = 'date', perPage: number = 25) {
        const url = `https://api.vimeo.com/videos?query=${encodeURIComponent(query)}&sort=${sort}&direction=desc&per_page=${perPage}`;
        return this.makeRequest(url);
    }

    async getUserVideos(userUri: string, sort: string = 'date', privacy?: string, perPage: number = 25) {
        let url = `https://api.vimeo.com${userUri}/videos?sort=${sort}&direction=desc&per_page=${perPage}`;
        if (privacy && privacy !== 'all') {
            url += `&privacy.view=${privacy}`;
        }
        return this.makeRequest(url);
    }

    async getUserLikes(userUri: string, sort: string = 'date', perPage: number = 25) {
        const url = `https://api.vimeo.com${userUri}/likes?sort=${sort}&direction=desc&per_page=${perPage}`;
        return this.makeRequest(url);
    }

    async findUser(query: string) {
        const url = `https://api.vimeo.com/users?query=${encodeURIComponent(query)}`;
        return this.makeRequest(url);
    }

    async uploadVideo(file: File, name: string, description?: string) {
        // This would implement the video upload logic
        // Vimeo uploads require a multi-step process with tus protocol
        throw new Error('Video upload not yet implemented');
    }

    async deleteVideo(videoId: string) {
        const url = `https://api.vimeo.com/videos/${videoId}`;
        return this.makeRequest(url, { method: 'DELETE' });
    }

    async addVideoToAlbum(videoId: string, albumId: string) {
        const url = `https://api.vimeo.com/me/albums/${albumId}/videos/${videoId}`;
        return this.makeRequest(url, { method: 'PUT' });
    }
} 