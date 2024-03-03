import { Component, Input, OnInit } from '@angular/core';
import {
  ActionType,
  FlowVersion,
  FlowVersionTemplate,
  TriggerType,
  flowHelper,
} from '@activepieces/shared';
import { Observable, map, of, tap } from 'rxjs';
import { CORE_PIECES_ACTIONS_NAMES, CORE_PIECES_TRIGGERS, PieceMetadataService, corePieceIconUrl } from '../services/piece-meta.service';


@Component({
  selector: 'ap-pieces-icons-from-flow',
  templateUrl: './pieces-icons-from-flow.component.html',
})
export class PiecesIconsFromFlowComponent implements OnInit {
  @Input({ required: true}) flowVersion!: FlowVersionTemplate | FlowVersion;
  @Input() useCoreMentionIcons = true;
  @Input() iconSize= 20;
  @Input() maxNumberOfIconsToLoad = 2;
  numberOfStepsLeft = 0;
  loadedIcons: Record<number, boolean> = {};
  urlsToLoad$: Observable<string>[] = [];
  tooltipText = '';
  stepNamesMap: Record<string, string> = {};
  piecesMetadata$: Observable<string>[] = [];
 
  constructor(private actionMetaDataService: PieceMetadataService) {}
  ngOnInit(): void {
    const icons$ = this.extractIconUrlsAndTooltipText();
    this.loadIconUrls(Object.values(icons$));
  }
  extractIconUrlsAndTooltipText() {
    const steps = flowHelper.getAllSteps(this.flowVersion.trigger);
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
               (CORE_PIECES_ACTIONS_NAMES.find((n) => s.settings.pieceName === n) ||
                CORE_PIECES_TRIGGERS.find((n) => s.settings.pieceName === n))
                && this.useCoreMentionIcons
              ) {
                return corePieceIconUrl(s.settings.pieceName);
              }
              return md.logoUrl;
            })
          );
        this.stepNamesMap[s.name] = '';
        stepsIconsUrls[s.settings.pieceName] = pieceMetaData$;
      } else if (s.type !== TriggerType.EMPTY) {
        const icon = this.actionMetaDataService.findNonPieceStepIcon(s.type);
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

  loadIconUrls(urls$: Observable<string>[]) {
    this.numberOfStepsLeft = Math.min(urls$.length - this.maxNumberOfIconsToLoad, 9);
    this.urlsToLoad$ = urls$.slice(0, this.maxNumberOfIconsToLoad);
    this.piecesMetadata$ = urls$;
  }
  extractTooltipText() {
    const stepsAppsNames = Array.from(
      new Set(Object.values(this.stepNamesMap).filter((v) => v !== ''))
    );
    if (stepsAppsNames.length === 1) {
      this.tooltipText = stepsAppsNames[0];
    } else if (stepsAppsNames.length < 7) {
      this.tooltipText =
        stepsAppsNames.slice(0, stepsAppsNames.length - 1).join(', ') +
        ` and ${stepsAppsNames[stepsAppsNames.length - 1]}`;
    } else {
      this.tooltipText = stepsAppsNames.join(', ') + ' and others';
    }
  }
}
