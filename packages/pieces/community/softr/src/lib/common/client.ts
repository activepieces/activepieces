import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { TableField } from './types';

export const BASE_URL = `https://tables-api.softr.io/api/v1`;

export async function makeRequest<T>(
  api_key: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'Softr-Api-Key': api_key,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}


export function transformRecordFields(
  tableFields: TableField[],
  	tableValues: Record<string, any>,
)
{
  const fieldMap: Record<string, string> = tableFields.reduce((acc, field) => {
		acc[field.id] = field.name;
		return acc;
	}, {} as Record<string, string>);

	const transformedFields: Record<string, any> = {};

	for (const [key, value] of Object.entries(tableValues)) {
		const label = fieldMap[key] ?? key;
		transformedFields[label] = value;
	}

	return transformedFields;
}