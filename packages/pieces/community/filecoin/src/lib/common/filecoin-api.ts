import * as https from 'https';
import * as http from 'http';

/**
 * Make an HTTP GET request using Node.js https module.
 */
export async function httpGet(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    const req = https.request(options, (res: http.IncomingMessage) => {
      let data = '';
      res.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', (err: Error) => reject(err));
    req.end();
  });
}

/**
 * Make an HTTP POST request using Node.js https module.
 */
export async function httpPost(
  url: string,
  body: object
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const bodyStr = JSON.stringify(body);
    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };

    const req = https.request(options, (res: http.IncomingMessage) => {
      let data = '';
      res.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', (err: Error) => reject(err));
    req.write(bodyStr);
    req.end();
  });
}
