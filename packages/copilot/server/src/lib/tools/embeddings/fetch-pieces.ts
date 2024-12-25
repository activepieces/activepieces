import { Piece } from './types';
import axios from 'axios';

const PIECES_API_URL = 'https://cloud.activepieces.com/api/v1/pieces';

export async function fetchPieces(): Promise<Piece[]> {
  try {
    const response = await axios.get<Piece[]>(PIECES_API_URL);

    if (!response.data) {
      console.error('No data received from API');
      return [];
    }

 
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    console.error('Error fetching pieces:', error);
    throw error;
  }
}
