import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  EnrichedStepMetaDataForMentions,
} from '@activepieces/ui/feature-builder-store';
import { Observable, switchMap } from 'rxjs';
import { enrichMentionDropdownWithIcons } from '@activepieces/ui/feature-builder-form-controls';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';

export class InputFormCore {
  protected stepMetaDataForMentions$: Observable<
    EnrichedStepMetaDataForMentions[]
  > = this.store
    .select(BuilderSelectors.selectAllStepsForMentionsDropdown)
    .pipe(
      switchMap((res) => {
        return enrichMentionDropdownWithIcons(res, this.pieceService);
      })
    );
  constructor(
    protected store: Store,
    private pieceService: PieceMetadataService
  ) {}
}
