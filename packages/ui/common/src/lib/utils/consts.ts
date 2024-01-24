import { FlowTemplate } from '@activepieces/shared';

export const unexpectedErrorMessage = $localize`An unexpected error occured, please contact support`;
export const flowActionsUiInfo = {
  duplicate: {
    text: $localize`Duplicate`,
    icon: 'assets/img/custom/duplicate.svg',
  },
  import: {
    text: $localize`Import`,
    icon: 'assets/img/custom/import.svg',
  },
  export: {
    text: $localize`Export`,
    icon: 'assets/img/custom/download.svg',
  },
  delete: {
    text: $localize`Delete`,
    icon: 'assets/img/custom/trash.svg',
    note: $localize`This will permanently delete the flow, all its data and any background runs.
    You can't undo this action.`,
  },
  rename: {
    text: $localize`Rename`,
    icon: 'assets/img/custom/pencil-underline.svg',
  },
  share: {
    text: $localize`Share`,
    icon: 'assets/img/custom/share.svg',
  },
  move: {
    text: $localize`Move to...`,
    icon: 'assets/img/custom/move.svg',
  },
  iconSizeTailWind: 'ap-w-[20px] ap-h-[20px]',
};

export const downloadFlow = (flow: FlowTemplate) => {
  const blob = new Blob([JSON.stringify(flow, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${flow.name}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
