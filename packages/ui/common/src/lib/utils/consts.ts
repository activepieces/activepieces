import {
  ApFlagId,
  FlowTemplate,
  ProjectMemberRole,
} from '@activepieces/shared';
import { AuthenticationService, FlagService } from '../service';
import { forkJoin, map } from 'rxjs';

export const unexpectedErrorMessage = $localize`An unexpected error occurred, please contact support`;
export const codeGeneratorTooltip = $localize`Write code with assistance from AI`;
export const disabledCodeGeneratorTooltip = $localize`Configure api key in the environment variables to generate code using AI`;

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
  pushToGit: {
    text: $localize`Push to Git`,
    icon: 'assets/img/custom/upload.svg',
  },
  iconSizeTailWind: 'ap-w-[20px] ap-h-[20px]',
};

export const downloadJson = (obj: any, fileName: string) => {
  const blob = new Blob([obj], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadFlow = (flow: FlowTemplate) => {
  downloadJson(JSON.stringify(flow, null, 2), flow.name);
};

export const jsonEditorOptionsMonaco = {
  minimap: { enabled: false },
  theme: 'apTheme',
  language: 'json',
  readOnly: true,
  automaticLayout: true,
};

export const EMPTY_SPACE_BETWEEN_INPUTS_IN_PIECE_PROPERTIES_FORM = 24 + 'px';
export const BOTTOM_MARGIN_FOR_DESCRIPTION_IN_PIECE_PROPERTIES_FORM = 18 + 'px';

export const findHomePageRouteForRole = (role: ProjectMemberRole) => {
  switch (role) {
    case ProjectMemberRole.ADMIN:
    case ProjectMemberRole.EDITOR:
    case ProjectMemberRole.VIEWER:
      return '/flows';
    case ProjectMemberRole.EXTERNAL_CUSTOMER:
      return '/activity';
  }
};

export const showPlatformDashboard$ = (
  authenticationService: AuthenticationService,
  flagsService: FlagService
) => {
  const platformAdmin = authenticationService.isPlatformOwner$();
  const showPlatformDemo = flagsService.isFlagEnabled(
    ApFlagId.SHOW_PLATFORM_DEMO
  );
  return forkJoin({
    platformAdmin,
    showPlatformDemo,
  }).pipe(
    map(
      ({ platformAdmin, showPlatformDemo }) =>
        (showPlatformDemo || platformAdmin) &&
        authenticationService.currentUser.projectRole !==
          ProjectMemberRole.EXTERNAL_CUSTOMER
    )
  );
};
/**Three colors that fits with our design system to use as backgrounds */
export const experimentalColors = ['#f5dc83', '#ed9090', '#90edb5'];
