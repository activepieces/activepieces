import { ApFile } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

async function analyze({ token, endpoint, file, queryParams = {} }: AnalyzeParams): Promise<unknown> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `https://api.zoo.dev/file/${endpoint}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    queryParams: { src_format: sourceFormatOf({ file }), ...queryParams },
    body: file.data,
  });
  return response.body;
}

function sourceFormatOf({ file }: { file: ApFile }): string {
  const extension = (file.extension ?? file.filename.split('.').pop() ?? '').replace(/^\./, '').toLowerCase();
  const format = EXTENSION_ALIASES[extension] ?? extension;
  if (!IMPORT_FORMATS.includes(format)) {
    throw new Error(
      `Unsupported CAD file type ".${extension}". Use one of: ${[...IMPORT_FORMATS, ...Object.keys(EXTENSION_ALIASES)].join(', ')}.`
    );
  }
  return format;
}

const IMPORT_FORMATS = ['acis', 'catia', 'creo', 'fbx', 'gltf', 'inventor', 'nx', 'obj', 'parasolid', 'ply', 'sldprt', 'step', 'stl'];

const EXTENSION_ALIASES: Record<string, string> = { stp: 'step', glb: 'gltf' };

export const cadFileAnalysis = { analyze };

type AnalyzeParams = {
  token: string;
  endpoint: string;
  file: ApFile;
  queryParams?: Record<string, string>;
};
