import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { PieceMetadataSummary } from '@activepieces/pieces-framework';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-template-app-tag-container',
  templateUrl: './template-app-tag-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateAppTagContainerComponent implements OnInit {
  @Input() pieceName: string;
  @Input() pieces$: Observable<
    Pick<PieceMetadataSummary, 'displayName' | 'logoUrl' | 'name'>[]
  >;
  pieceMetadata$: Observable<
    Pick<PieceMetadataSummary, 'displayName' | 'logoUrl' | 'name'> | undefined
  >;
  @Output() removePiece = new EventEmitter<string>();
  ngOnInit(): void {
    this.pieceMetadata$ = this.pieces$.pipe(
      map((pieces) => pieces.find((p) => p.name === this.pieceName))
    );
  }
}
