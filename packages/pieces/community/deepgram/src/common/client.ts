export const createDeepgramClient = (apiKey: string) => {
  return {
    async get(endpoint: string) {
      const response = await fetch(`https://api.deepgram.com/v1${endpoint}`, {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return handleResponse(response);
    },

    async post(endpoint: string, options: {
      body: any,
      headers?: Record<string, string>,
      queryParams?: Record<string, string>,
      responseType?: 'json' | 'arraybuffer'
    }) {
      const url = new URL(`https://api.deepgram.com/v1${endpoint}`);
      
      if (options.queryParams) {
        Object.entries(options.queryParams).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const isBodyBlob = options.body instanceof Blob || options.body instanceof ArrayBuffer;
      const body = isBodyBlob ? options.body : JSON.stringify(options.body);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json' ,
        },
        body
      });

      return handleResponse(response, options.responseType);
    }
  };
};

async function handleResponse(response: Response, responseType: 'json' | 'arraybuffer' = 'json') {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Deepgram API error: ${error}`);
  }

  if (responseType === 'arraybuffer') {
    return {
      body: await response.arrayBuffer(),
      headers: response.headers
    };
  }
  
  return {
    body: await response.json(),
    headers: response.headers
  };
}

export type DeepgramClient = ReturnType<typeof createDeepgramClient>;