import { Component, Input, OnInit } from '@angular/core';
import {
  Action,
  ActionType,
  FlowVersion,
  Trigger,
  TriggerType,
  flowHelper,
} from '@activepieces/shared';
import {
  ActionMetaService,
  CORE_PIECES_ACTIONS_NAMES,
  CORE_PIECES_TRIGGERS,
  corePieceIconUrl,
} from '@activepieces/ui/common';
import { Observable, map, of, tap } from 'rxjs';

@Component({
  selector: 'app-steps-list-in-flows-table',
  templateUrl: './steps-list-in-flows-table.component.html',
})
export class StepsListInFlowsTableComponent implements OnInit {
  @Input() flowVersion: FlowVersion;
  numberOfStepsLeft = 0;
  loadedIcons: Record<number, boolean> = {};
  urlsToLoad$: Observable<string>[] = [];
  tooltipText = '';
  stepNamesMap: Record<string, string> = {};
  piecesMetadata$: Observable<string>[] = [];
  constructor(private actionMetaDataService: ActionMetaService) {}
  ngOnInit(): void {
    const icons$ = this.extractIconUrlsAndTooltipText();
    this.loadIconUrls(Object.values(icons$));
  }
  extractIconUrlsAndTooltipText() {
    const steps = flowHelper.getAllSteps(this.flowVersion);
    const stepsIconsUrls: Record<string, Observable<string>> = {};

    steps.forEach((s) => {
      if (s.type === ActionType.PIECE || s.type === TriggerType.PIECE) {
        const pieceMetaData$ = this.actionMetaDataService
          .getPieceMetadata(s.settings.pieceName, s.settings.pieceVersion)
          .pipe(
            tap((md) => {
              this.stepNamesMap[s.name] = md.displayName;
              this.extractTooltipText();
            }),
            map((md) => {
              if (
                CORE_PIECES_ACTIONS_NAMES.find(
                  (n) => s.settings.pieceName === n
                ) ||
                CORE_PIECES_TRIGGERS.find((n) => s.settings.pieceName === n)
              ) {
                return corePieceIconUrl(s.settings.pieceName);
              }
              return md.logoUrl;
            })
          );
        this.stepNamesMap[s.name] = '';
        stepsIconsUrls[s.settings.pieceName] = pieceMetaData$;
      } else if (s.type !== TriggerType.EMPTY) {
        const icon = this.findNonPieceStepIcon(s);
        const displayName =
          [
            ...this.actionMetaDataService.coreFlowItemsDetails,
            ...this.actionMetaDataService.triggerItemsDetails,
          ].find((d) => d.type === s.type)?.name || '';
        this.stepNamesMap[s.name] = displayName;
        stepsIconsUrls[icon.key] = of(icon.url);
      }
    });
    this.extractTooltipText();
    return stepsIconsUrls;
  }

  findNonPieceStepIcon(step: Trigger | Action) {
    switch (step.type) {
      case ActionType.CODE:
        return { url: 'assets/img/custom/piece/code_mention.png', key: 'code' };
      case ActionType.BRANCH:
        return {
          url: 'assets/img/custom/piece/branch_mention.png',
          key: 'branch',
        };
      case ActionType.LOOP_ON_ITEMS:
        return {
          url: 'assets/img/custom/piece/loop_mention.png',
          key: 'loop',
        };
      case TriggerType.WEBHOOK:
        return {
          url: 'assets/img/custom/piece/webhook_mention.png',
          key: 'webhook',
        };
    }

    throw new Error("Step type isn't accounted for");
  }
  loadIconUrls(urls$: Observable<string>[]) {
    this.numberOfStepsLeft = Math.min(urls$.length - 2, 9);
    this.urlsToLoad$ = urls$.slice(0, 2);
    this.piecesMetadata$ = urls$;
  }
  extractTooltipText() {
    const stepNames = Object.values(this.stepNamesMap).filter((v) => v !== '');
    if (stepNames.length === 1) {
      this.tooltipText = stepNames[0];
    } else if (stepNames.length < 7) {
      this.tooltipText =
        stepNames.slice(0, stepNames.length - 1).join(', ') +
        ` and ${stepNames[stepNames.length - 1]}`;
    } else {
      this.tooltipText = stepNames.join(', ') + ' and others';
    }
  }
}
