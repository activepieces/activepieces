import { EnrichedStepMetaDataForMentions } from '@activepieces/ui/feature-builder-store';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  Renderer2,
} from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-array-form-control-text-item',
  template: `
    <div [class.ap-opacity-0]="dragging">
      <div
        class="ap-flex ap-gap-1 ap-justify-between ap-items-center"
        cdkDrag
        cdkDragBoundary=".drag-list"
        (cdkDragStarted)="grabbingStarted()"
        (cdkDragEnded)="grabbingEnded()"
      >
        <mat-icon
          [matTooltip]="hideTooltip ? '' : dragTooltip"
          class="ap-cursor-grab"
          cdkDragHandle
          >drag_indicator</mat-icon
        >
        <div class="ap-flex-grow" #interpolatingTextControlContainer>
          <mat-form-field
            apTrackHover
            #valueInput="hoverTrackerDirective"
            class="ap-w-[100%]"
            [subscriptSizing]="'dynamic'"
          >
            <mat-label>Item {{ idx + 1 }}</mat-label>
            <app-interpolating-text-form-control
              #textControl
              [stepMetaDataForMentions]="stepMetaDataForMentions"
              [insideMatField]="false"
              [formControl]="control"
              (click)="control.enabled ? handler.showMentionsDropdown() : null"
            ></app-interpolating-text-form-control>
            <app-builder-autocomplete-dropdown-handler
              #handler
              [container]="interpolatingTextControlContainer"
              (mentionEmitted)="textControl.addMention($event)"
            >
            </app-builder-autocomplete-dropdown-handler>
          </mat-form-field>
        </div>
        <div
          class="ap-flex ap-items-center ap-justify-center ap-h-[30px] ap-w-[30px] ap-cursor-pointer "
          [matTooltip]="hideTooltip ? '' : removeItemTooltip"
          (click)="removeValue.emit(idx)"
        >
          <svg-icon
            src="assets/img/custom/close.svg"
            class="ap-w-[15px] ap-h-[15px] "
            [applyClass]="true"
          >
          </svg-icon>
        </div>
      </div>
    </div>
  `,
})
export class ArrayFormControlTextItemComponent {
  removeItemTooltip = $localize`Remove item`;
  dragTooltip = $localize`Drag to reorder`;
  dragging = false;
  @Input({ required: true }) idx: number;
  @Input({ required: true }) control: FormControl;
  @Input({ required: true }) hideTooltip = false;
  @Output() removeValue = new EventEmitter<number>();
  @Output() itemDragStateChanged = new EventEmitter<boolean>();
  @Input({ required: true })
  stepMetaDataForMentions: EnrichedStepMetaDataForMentions[] = [];
  constructor(private renderer: Renderer2) {}
  grabbingStarted() {
    this.renderer.addClass(document.body, 'dragging');
    this.dragging = true;
    this.itemDragStateChanged.emit(true);
  }
  grabbingEnded() {
    this.renderer.removeClass(document.body, 'dragging');
    this.dragging = false;
    this.itemDragStateChanged.emit(false);
  }
}
