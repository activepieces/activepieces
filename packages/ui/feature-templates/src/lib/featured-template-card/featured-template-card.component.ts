import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Flow, FlowTemplate, FolderId } from '@activepieces/shared';

import { Observable } from 'rxjs';

@Component({
  selector: 'app-featured-template-card',
  templateUrl: './featured-template-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedTemplateCardComponent implements OnInit {
  useTemplate$: Observable<Flow>;
  showFullDescription = false;
  readonly SEE_MORE_LIMIT = 255;
  @Output() useTemplateClicked = new EventEmitter<FlowTemplate>();
  @Input() template: FlowTemplate;
  activepiecesTeam = false;
  loading = false;
  @Input() folderId?: FolderId | null;
  constructor(private cd: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.activepiecesTeam = this.template.user
      ? this.template.user.email?.endsWith('activepieces.com') || false
      : false;
  }
  useTemplate() {
    this.useTemplateClicked.emit(this.template);
  }
  ngAfterViewInit(): void {
    //This is a workaround to make tooltip appear.
    setTimeout(() => {
      this.cd.markForCheck();
    }, 100);
  }
}
