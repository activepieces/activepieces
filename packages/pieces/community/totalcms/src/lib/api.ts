import {
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { TotalCMSAuthType } from './auth';
import FormData from 'form-data';

export type KeyValuePair = {
  [key: string]: string | boolean | number | object | undefined;
};
export type FileUpload = { filename: string; base64: string };

const totalcmsAPI = async (
  auth: TotalCMSAuthType,
  type: string,
  slug: string,
  query: QueryParams = {},
  data: KeyValuePair = {},
  method: HttpMethod = HttpMethod.GET
) => {
  if (method === HttpMethod.GET) {
    query['slug'] = slug;
    query['type'] = type;
  } else {
    data['slug'] = slug;
    data['type'] = type;
  }

  const request: HttpRequest = {
    body: data,
    queryParams: query,
    method: method,
    url: `${auth.domain}/rw_common/plugins/stacks/total-cms/totalapi.php`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'total-key': auth.license,
    },
  };
  const response = await httpClient.sendRequest(request);

  if (response.status !== 200) {
    throw new Error(`Total CMS API error: ${response.status} ${response.body}`);
  }

  return {
    success: true,
    data: response.body['data'],
  };
};

const totalcmsUploadAPI = async (
  auth: TotalCMSAuthType,
  type: string,
  slug: string,
  file: FileUpload,
  data: KeyValuePair = {},
  fileName = 'file'
) => {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('slug', slug);

  formData.append(fileName, Buffer.from(file.base64, 'base64'), file.filename);

  for (const key in data) {
    if (fileName !== 'file') {
      // blog post images use the format image[alt] or gallery[alt]
      formData.append(`${fileName}[${key}]`, data[key]);
    }
    formData.append(key, data[key]);
  }

  const request: HttpRequest = {
    body: formData,
    method: HttpMethod.POST,
    url: `${auth.domain}/rw_common/plugins/stacks/total-cms/totalapi.php`,
    headers: {
      'Content-Type': 'multipart/form-data',
      'total-key': auth.license,
    },
  };
  const response = await httpClient.sendRequest(request);

  if (response.status !== 200) {
    throw new Error(`Total CMS API error: ${response.status} ${response.body}`);
  }

  return {
    success: true,
    data: response.body['data'],
  };
};

export async function saveFile(
  auth: TotalCMSAuthType,
  slug: string,
  file: FileUpload,
  data: KeyValuePair
) {
  return totalcmsUploadAPI(auth, 'file', slug, file, data);
}

export async function saveDepot(
  auth: TotalCMSAuthType,
  slug: string,
  file: FileUpload
) {
  return totalcmsUploadAPI(auth, 'depot', slug, file);
}

export async function saveImage(
  auth: TotalCMSAuthType,
  slug: string,
  file: FileUpload,
  data: KeyValuePair
) {
  return totalcmsUploadAPI(auth, 'image', slug, file, data);
}

export async function saveGallery(
  auth: TotalCMSAuthType,
  slug: string,
  file: FileUpload,
  data: KeyValuePair
) {
  return totalcmsUploadAPI(auth, 'gallery', slug, file, data);
}

export async function saveBlogImage(
  auth: TotalCMSAuthType,
  slug: string,
  file: FileUpload,
  data: KeyValuePair
) {
  return totalcmsUploadAPI(auth, 'blog', slug, file, data, 'image');
}

export async function saveBlogGallery(
  auth: TotalCMSAuthType,
  slug: string,
  file: FileUpload,
  data: KeyValuePair
) {
  return totalcmsUploadAPI(auth, 'blog', slug, file, data, 'gallery');
}

export async function saveContent(
  auth: TotalCMSAuthType,
  type: string,
  slug: string,
  data: KeyValuePair
) {
  return totalcmsAPI(auth, type, slug, {}, data, HttpMethod.POST);
}

export async function getContent(
  auth: TotalCMSAuthType,
  type: string,
  slug: string,
  query: QueryParams = {}
) {
  return totalcmsAPI(auth, type, slug, query);
}

export async function getBlogPost(
  auth: TotalCMSAuthType,
  slug: string,
  permalink: string
) {
  return totalcmsAPI(auth, 'blog', slug, { permalink: permalink });
}
