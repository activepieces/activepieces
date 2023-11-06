import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApFlagId, supportUrl } from '@activepieces/shared';
import { Observable, map, switchMap } from 'rxjs';
import { FlagService } from '@activepieces/ui/common';
import { EmbeddingService } from '@activepieces/ui/common';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportComponent {
  showSupport$: Observable<boolean>;

  constructor(
    private flagService: FlagService,
    private embeddingService: EmbeddingService
  ) {
    this.showSupport$ = this.flagService
      .isFlagEnabled(ApFlagId.SHOW_COMMUNITY)
      .pipe(
        switchMap((res) => {
          return this.embeddingService.getIsInEmbedding$().pipe(
            map((emb) => {
              return !emb && res;
            })
          );
        })
      );
  }

  openSupport() {
    window.open(supportUrl, '_blank', 'noopener');
  }
}
