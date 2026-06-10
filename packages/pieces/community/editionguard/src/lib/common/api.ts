import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://app.editionguard.com/api/v2';

type Book = {
  resource_id: string;
  title: string;
  drm_type: string;
};

type BookListResponse = {
  results: Book[];
};

type Transaction = {
  id: string;
  resource_id: string;
  download_link: string | null;
  customer_email: string | null;
  order_number: string | null;
  created_at: string;
  status: string;
};

async function listBooks({ token }: { token: string }): Promise<Book[]> {
  const response = await httpClient.sendRequest<BookListResponse>({
    method: HttpMethod.GET,
    url: `${BASE_URL}/book`,
    headers: { Authorization: `token ${token}` },
    queryParams: { page_size: '100000' },
  });
  return response.body.results;
}

async function createTransaction({
  token,
  resourceId,
  customerEmail,
  orderNumber,
  quantity,
  watermarkName,
  watermarkEmail,
  watermarkPhone,
}: {
  token: string;
  resourceId: string;
  customerEmail: string;
  orderNumber: string;
  quantity: number;
  watermarkName?: string;
  watermarkEmail?: string;
  watermarkPhone?: string;
}): Promise<Transaction> {
  const body: Record<string, unknown> = {
    resource_id: resourceId,
    customer_email: customerEmail,
    order_number: orderNumber,
    quantity,
  };
  if (watermarkName) body['watermark_name'] = watermarkName;
  if (watermarkEmail) body['watermark_email'] = watermarkEmail;
  if (watermarkPhone) body['watermark_phone'] = watermarkPhone;

  const response = await httpClient.sendRequest<Transaction>({
    method: HttpMethod.POST,
    url: `${BASE_URL}/transaction`,
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}

export const editionguardApi = { listBooks, createTransaction };
