import { Piece } from './types';
import axios from 'axios';

const PIECES_API_URL = 'https://cloud.activepieces.com/api/v1/pieces';

export async function fetchPieces(): Promise<Piece[]> {
  try {
    console.debug('Fetching pieces from API...');
    const response = await axios.get<Piece[]>(PIECES_API_URL);
    
    if (!response.data) {
      console.error('No data received from API');
      return [];
    }

    console.debug(`Successfully fetched ${response.data.length} pieces`);
    console.debug('First piece sample:', JSON.stringify(response.data[0], null, 2));
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    console.error('Error fetching pieces:', error);
    throw error;
  }
} 