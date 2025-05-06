export const BASE_URL = 'https://api.dumplingai.com/v1';

export const apiHeaders = (apiKey: string) => {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}; 