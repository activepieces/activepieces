import axios from 'axios';

const KNACK_API_BASE = 'https://api.knack.com/v1';

export function makeClient(apiKey: string) {
    return axios.create({
        baseURL: KNACK_API_BASE,
        headers: {
            'X-Knack-Application-Id': apiKey,
            'Content-Type': 'application/json',
        },
    });
}
