import {
  ApFlagId,
  FlowTemplate,
  ProjectMemberRole,
} from '@activepieces/shared';
import { AuthenticationService, FlagService } from '../service';
import { forkJoin, map, take } from 'rxjs';
export type FeatureKey =
  | 'PROJECTS'
  | 'BRANDING'
  | 'PIECES'
  | 'TEMPLATES'
  | 'API'
  | 'SSO'
  | 'AUDIT_LOGS'
  | 'GIT_SYNC'
  | 'ISSUES'
  | 'ALERTS';
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

export const flowDeleteNoteWithGit = $localize`This will permanently delete the flow, all its data and any background runs.
You can't undo this action including git branch.`;
export const flowDeleteNote = $localize`This will permanently delete the flow, all its data and any background runs.`;
export const downloadFile = (
  obj: any,
  fileName: string,
  extension: 'txt' | 'json'
) => {
  const blob = new Blob([obj], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadFlow = (flow: FlowTemplate) => {
  downloadFile(JSON.stringify(flow, null, 2), flow.name, 'json');
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
  return '/flows';
};

export const showPlatformDashboard$ = (
  authenticationService: AuthenticationService,
  flagsService: FlagService
) => {
  const platformAdmin = authenticationService.isPlatformOwner$().pipe(take(1));
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
export const executionsPageFragments = {
  Runs: 'Runs',
  Issues: 'Issues',
};
export const TEN_SECONDS = 10000;
