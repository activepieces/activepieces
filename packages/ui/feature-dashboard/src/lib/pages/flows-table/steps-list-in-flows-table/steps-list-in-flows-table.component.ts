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
import { Observable, map, of } from 'rxjs';

@Component({
  selector: 'app-steps-list-in-flows-table',
  templateUrl: './steps-list-in-flows-table.component.html',
})
export class StepsListInFlowsTableComponent implements OnInit {
  @Input() flowVersion: FlowVersion;
  numberOfStepsLeft = 0;
  loadedIcons: Record<number, boolean> = {};
  urlsToLoad$: Observable<string>[] = [];
  constructor(private actionMetaDataService: ActionMetaService) {}
  ngOnInit(): void {
    const iconUrls$ = this.extractIconUrls();
    this.loadIconUrls(Object.values(iconUrls$));
  }
  extractIconUrls() {
    const steps = flowHelper.getAllSteps(this.flowVersion);
    const stepsIconsUrls: Record<string, Observable<string>> = {};
    steps.forEach((s) => {
      if (s.type === ActionType.PIECE || s.type === TriggerType.PIECE) {
        const pieceMetaData$ = this.actionMetaDataService
          .getPieceMetadata(s.settings.pieceName, s.settings.pieceVersion)
          .pipe(
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
        stepsIconsUrls[s.settings.pieceName] = pieceMetaData$;
      } else {
        const icon = this.findNonPieceStepIcon(s);
        stepsIconsUrls[icon.key] = of(icon.url);
      }
    });
    console.log(steps);
    return stepsIconsUrls;
  }
  findNonPieceStepIcon(step: Trigger | Action) {
    if (step.type === ActionType.CODE) {
      return { url: 'assets/img/custom/piece/code_mention.png', key: 'code' };
    }
    if (step.type === ActionType.BRANCH) {
      return {
        url: 'assets/img/custom/piece/branch_mention.png',
        key: 'branch',
      };
    }
    if (step.type === ActionType.LOOP_ON_ITEMS) {
      return {
        url: 'assets/img/custom/piece/loop_mention.png',
        key: 'loop',
      };
    }
    if (step.type === TriggerType.EMPTY) {
      return {
        url: 'assets/img/custom/piece/emptyTrigger.png',
        key: 'empty',
      };
    }
    if (step.type === TriggerType.WEBHOOK) {
      return {
        url: 'assets/img/custom/piece/webhook_mention.png',
        key: 'webhook',
      };
    }
    throw new Error("Step type isn't accounted for");
  }
  loadIconUrls(urls$: Observable<string>[]) {
    this.numberOfStepsLeft = urls$.length - 2;
    this.urlsToLoad$ = urls$.slice(0, 2);
  }
}
