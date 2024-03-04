import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FlowTemplate } from '@activepieces/shared';

@Component({
  selector: 'app-template-card',
  templateUrl: './template-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateCardComponent implements AfterViewInit {
  @Output() useTemplateClicked = new EventEmitter<FlowTemplate>();
  @Output() descriptionButtonClicked = new EventEmitter<FlowTemplate>();
  @Input() template: FlowTemplate;
  loading = false;
  constructor(private cd: ChangeDetectorRef) {}
  ngAfterViewInit(): void {
    //This is a workaround to make tooltip appear.
    setTimeout(() => {
      this.cd.markForCheck();
    }, 100);
  }
  showTemplateDescription() {
    this.descriptionButtonClicked.emit(this.template);
  }
}
