import { Property } from '@activepieces/pieces-framework';

function repoType() {
  return Property.StaticDropdown({
    displayName: 'Repository Type',
    description: "The kind of Hub repository: 'model', 'dataset' or 'space'.",
    required: true,
    defaultValue: 'model',
    options: {
      disabled: false,
      options: [
        { label: 'Model', value: 'model' },
        { label: 'Dataset', value: 'dataset' },
        { label: 'Space', value: 'space' },
      ],
    },
  });
}

function repoId() {
  return Property.ShortText({
    displayName: 'Repository ID',
    description:
      "The repository ID in 'namespace/name' form, for example 'openai-community/gpt2' or 'stanfordnlp/imdb'. Find it with Search Models, Search Datasets or Search Spaces.",
    required: true,
  });
}

function revision() {
  return Property.ShortText({
    displayName: 'Revision',
    description:
      "Branch, tag, or commit SHA to read, for example 'main', 'v1.0' or 'refs/pr/1'. Defaults to 'main'. List available refs with List Branches & Tags.",
    required: false,
    defaultValue: 'main',
  });
}

function optionalRevision() {
  return Property.ShortText({
    displayName: 'Revision',
    description:
      "Optional branch, tag, or commit SHA, for example 'main' or 'refs/pr/1'. Leave empty for the default branch.",
    required: false,
  });
}

function cursor() {
  return Property.ShortText({
    displayName: 'Cursor',
    description:
      "The 'next_cursor' value returned by a previous call, to fetch the next page. Leave empty for the first page.",
    required: false,
  });
}

function limit({ defaultValue, max }: LimitParams) {
  return Property.Number({
    displayName: 'Limit',
    description: `Maximum number of results in this page (1 to ${max}).`,
    required: false,
    defaultValue,
  });
}

function page() {
  return Property.Number({
    displayName: 'Page',
    description: 'Zero-based page number. Use 0 for the first page, then the returned next_page value.',
    required: false,
    defaultValue: 0,
  });
}

export const hfProps = {
  repoType,
  repoId,
  revision,
  optionalRevision,
  cursor,
  limit,
  page,
};

type LimitParams = {
  defaultValue: number;
  max: number;
};
