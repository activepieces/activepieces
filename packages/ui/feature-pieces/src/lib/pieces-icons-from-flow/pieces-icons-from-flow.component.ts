import { Component, Input, OnInit } from '@angular/core';
import {
  Action,
  ActionType,
  FlowVersion,
  FlowVersionTemplate,
  Trigger,
  TriggerType,
  flowHelper,
} from '@activepieces/shared';
import { Observable, forkJoin, map } from 'rxjs';
import { FlowItemDetails } from '@activepieces/ui/common';
import { PieceMetadataService } from '../services/piece.service';


@Component({
  selector: 'ap-pieces-icons-from-flow',
  template: `
  <div class="ap-inline-block" *ngIf="tooltipText$ | async as tooltip"[matTooltip]="tooltip">
    <ng-container *ngIf="urlsToLoad$| async as urls">
    <ng-container *ngFor="let url of urls; let isFirst=first">
        <ap-piece-icon-container [iconSize]="iconSize" [url]="url" [class.ap-ml-[5px]]="!isFirst">
        </ap-piece-icon-container>
    </ng-container>
    </ng-container>
    <ap-piece-icon-container [iconSize]="iconSize" *ngIf="numberOfStepsLeft > 0" [moreIconsNumber]="numberOfStepsLeft">
    </ap-piece-icon-container>
</div>
`
})
export class PiecesIconsFromFlowComponent implements OnInit {
  @Input({ required: true }) flowVersion!: FlowVersionTemplate | FlowVersion;
  @Input() iconSize = 20;
  @Input() maxNumberOfIconsToLoad = 2;
  numberOfStepsLeft = 0;
  urlsToLoad$: Observable<string[]> | undefined;
  tooltipText$: Observable<string> | undefined;

  constructor(private pieceService: PieceMetadataService) { }
  ngOnInit(): void {
    const steps = this.filterOutDuplicates(flowHelper.getAllSteps(this.flowVersion.trigger));
    const stepMetadata$: Observable<FlowItemDetails>[] = steps.map((step) => this.pieceService.getStepDetails(step));
    this.urlsToLoad$ = forkJoin(stepMetadata$).pipe(
      map((items) => items.map((item) => item.logoUrl!).slice(0, this.maxNumberOfIconsToLoad)));
    this.numberOfStepsLeft = Math.min(steps.length - this.maxNumberOfIconsToLoad, 9);
    this.tooltipText$ = forkJoin(stepMetadata$).pipe(map((items) => this.extractTooltipText(items)));
  }

  private extractTooltipText(items: FlowItemDetails[]): string {
    const stepsAppsNames = items.map((item) => item.name);
    if (stepsAppsNames.length === 1) {
      return stepsAppsNames[0]!;
    } else if (stepsAppsNames.length <= 7) {
      return stepsAppsNames.slice(0, stepsAppsNames.length - 1).join(', ') +
        ` and ${stepsAppsNames[stepsAppsNames.length - 1]}`;
    } else {
      return stepsAppsNames.join(', ') + ' and others';
    }
  }

  private filterOutDuplicates(steps: (Action | Trigger)[])
  {
    const seen = new Set<string>();
    return steps.filter((step) => {
      let isDuplicate = false;
     if(step.type === ActionType.PIECE || step.type === TriggerType.PIECE) 
      {
        isDuplicate = seen.has(step.settings.pieceName);
        seen.add(step.settings.pieceName);
      }
      else{
        isDuplicate = seen.has(step.type);
        seen.add(step.type);
      }
      return !isDuplicate;
    });
  }
}
