import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { gammaAuth } from '../common/auth';

export const generateGamma = createAction({
  auth: gammaAuth,
  name: 'generateGamma',
  classification: 'WRITE',
  displayName: 'Generate Gamma',
  description: 'Start creating a presentation, document, social post or webpage from text.',
  audience: 'both',
  aiMetadata: {
    description: 'Starts an asynchronous Gamma generation job from input text, producing a presentation, document, social post, or webpage (set via the format prop). Use to kick off AI content creation; the job runs in the background, so follow up with "Get Generation" using the returned generation ID to poll for completion and outputs. Requires input text (1-400,000 chars); not idempotent — each call queues a new generation and consumes credits.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'content',
      display: 'section',
      label: 'Content',
      icon: 'text',
      props: ['inputText', 'textMode', 'additionalInstructions'],
    },
    {
      key: 'design',
      display: 'section',
      label: 'Design',
      icon: 'sliders',
      props: ['format', 'themeName', 'numCards', 'cardSplit'],
    },
    {
      key: 'output',
      display: 'section',
      label: 'Output',
      icon: 'file',
      props: ['folderId', 'exportAs', 'backgroundNote'],
    },
  ],
  props: {
    folderId: Property.Dropdown({
      displayName: 'Folder',
      description: 'A folder in your Gamma workspace. Empty: no folder.',
      required: false,
      refreshers: ['auth'],
      auth: gammaAuth,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect your Gamma account first' };
        try {
          const folders = await listAllFolders({ apiKey: auth.props.apiKey });
          if (folders.length === 0) return { disabled: false, options: [], placeholder: 'No folders found' };
          return { disabled: false, options: folders.map((f) => ({ label: f.name, value: f.id })) };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load folders. Check your connection.' };
        }
      },
    }),
    inputText: Property.LongText({
      displayName: 'Text',
      description:
        'A prompt, notes or a full outline. Up to 400,000 characters.',
      placeholder: 'A 10-card pitch deck for a coffee subscription startup',
      required: true,
    }),
    textMode: Property.StaticDropdown({
      displayName: 'Text Mode',
      description: 'Generate expands your text, Condense shortens it, Preserve keeps it.',
      required: false,
      options: {
        options: [
          { label: 'Generate', value: 'generate' },
          { label: 'Condense', value: 'condense' },
          { label: 'Preserve', value: 'preserve' },
        ],
      },
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'What to create. Empty: presentation.',
      width: 'half',
      required: false,
      options: {
        options: [
          { label: 'Presentation', value: 'presentation' },
          { label: 'Document', value: 'document' },
          { label: 'Social', value: 'social' },
          { label: 'Webpage', value: 'webpage' },
        ],
      },
    }),
    themeName: Property.ShortText({
      displayName: 'Theme',
      description:
        "A theme name from Gamma's theme picker. Empty: workspace default.",
      width: 'half',
      required: false,
    }),
    numCards: Property.Number({
      displayName: 'Number of Cards',
      description:
        'How many cards to create. Default 10; your plan sets the maximum.',
      width: 'half',
      required: false,
    }),
    cardSplit: Property.StaticDropdown({
      displayName: 'Card Split',
      description: 'Auto uses Number of Cards; At --- Lines ignores it.',
      width: 'half',
      required: false,
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'At --- Lines', value: 'inputTextBreaks' },
        ],
      },
    }),
    additionalInstructions: Property.LongText({
      displayName: 'Additional Instructions',
      description:
        'Extra guidance on content and layout. Up to 5,000 characters.',
      placeholder: 'Use simple language and one image per card',
      required: false,
    }),
    exportAs: Property.StaticDropdown({
      displayName: 'Export As',
      description: 'Also save it as a file. Get Generation returns the file link.',
      required: false,
      options: {
        placeholder: "Don't export",
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'PowerPoint (PPTX)', value: 'pptx' },
          { label: 'PNG Images (ZIP)', value: 'png' },
        ],
      },
    }),
    backgroundNote: Property.MarkDown({
      value: 'Gamma builds the gamma in the background. Use **Get Generation** with the returned generation ID to get the link and files.',
      variant: MarkdownVariant.INFO,
    }),
    textOptions: Property.Json({
      displayName: 'Text Options',
      description: 'Keys: amount, tone, audience, language. E.g. {"amount": "brief"}',
      required: false,
      advanced: true,
      defaultValue: {},
    }),
    imageOptions: Property.Json({
      displayName: 'Image Options',
      description: 'Keys: source, model, style. E.g. {"source": "aiGenerated"}',
      required: false,
      advanced: true,
      defaultValue: {},
    }),
    cardOptions: Property.Json({
      displayName: 'Card Options',
      description: 'Keys: dimensions, headerFooter. E.g. {"dimensions": "16x9"}',
      required: false,
      advanced: true,
      defaultValue: {},
    }),
    sharingOptions: Property.Json({
      displayName: 'Sharing Options',
      description: 'Keys: workspaceAccess, externalAccess, emailOptions.',
      required: false,
      advanced: true,
      defaultValue: {},
    }),
  },
  async run(context) {
    const {
      inputText,
      textMode,
      format,
      themeName,
      numCards,
      cardSplit,
      additionalInstructions,
      exportAs,
      textOptions,
      imageOptions,
      cardOptions,
      sharingOptions,
      folderId,
    } = context.propsValue;


    const body: Record<string, unknown> = {
      inputText,
    };

    if (textMode) body['textMode'] = textMode;
    if (format) body['format'] = format;
    if (themeName) {
      const themeId = await findThemeId({ apiKey: context.auth.props.apiKey, theme: themeName });
      if (themeId) body['themeId'] = themeId;
      else body['themeName'] = themeName;
    }
    if (numCards) body['numCards'] = numCards;
    if (cardSplit) body['cardSplit'] = cardSplit;
    if (additionalInstructions)
      body['additionalInstructions'] = additionalInstructions;
    if (exportAs) body['exportAs'] = exportAs;

    if (textOptions && Object.keys(textOptions).length > 0)
      body['textOptions'] = textOptions;
    if (imageOptions && Object.keys(imageOptions).length > 0)
      body['imageOptions'] = imageOptions;
    if (cardOptions && Object.keys(cardOptions).length > 0)
      body['cardOptions'] = cardOptions;
    if (sharingOptions && Object.keys(sharingOptions).length > 0)
      body['sharingOptions'] = sharingOptions;
    if (folderId) body['folderId'] = folderId;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://public-api.gamma.app/v1.0/generations',
      headers: {
        'X-API-KEY': context.auth.props.apiKey,
        'Content-Type': 'application/json',
      },
      body: body,
    });


    return response.body;
  },
});

async function listAllFolders({ apiKey, after }: { apiKey: string; after?: string }): Promise<GammaFolder[]> {
  const response = await httpClient.sendRequest<GammaPage<GammaFolder>>({
    method: HttpMethod.GET,
    url: 'https://public-api.gamma.app/v1.0/folders',
    headers: { 'X-API-KEY': apiKey },
    queryParams: after ? { limit: '50', after } : { limit: '50' },
  });
  const folders = response.body.data ?? [];
  const next = response.body.hasMore ? response.body.nextCursor ?? undefined : undefined;
  if (!next || next === after) return folders;
  return [...folders, ...(await listAllFolders({ apiKey, after: next }))];
}

async function findThemeId({ apiKey, theme }: { apiKey: string; theme: string }): Promise<string | undefined> {
  const wanted = theme.trim();
  try {
    const response = await httpClient.sendRequest<GammaPage<GammaTheme>>({
      method: HttpMethod.GET,
      url: 'https://public-api.gamma.app/v1.0/themes',
      headers: { 'X-API-KEY': apiKey },
      queryParams: { query: wanted, limit: '50' },
      timeout: 5000,
    });
    const match = (response.body.data ?? []).find(
      (t) => t.id === wanted || t.name.toLowerCase() === wanted.toLowerCase(),
    );
    return match?.id;
  } catch {
    return undefined;
  }
}

type GammaFolder = { id: string; name: string };
type GammaTheme = { id: string; name: string };
type GammaPage<T> = { data?: T[]; hasMore?: boolean; nextCursor?: string | null };
