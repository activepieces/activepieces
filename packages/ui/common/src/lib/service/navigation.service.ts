import { Injectable } from '@angular/core';
import { EmbeddingService } from './embedding.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(
    private embeddingService: EmbeddingService,
    private router: Router
  ) {}

  navigate(params: {
    openInNewWindow?: boolean;
    route: Parameters<Router['navigate']>[0];
    extras?: Parameters<Router['navigate']>[1];
  }) {
    if (
      this.embeddingService.getState().isEmbedded ||
      !params.openInNewWindow
    ) {
      this.router.navigate(params.route, {
        ...params.extras,
        skipLocationChange: this.embeddingService.getSkipLocationChange(),
      });
    } else {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(params.route)
      );
      window.open(url, '_blank', 'noopener noreferrer');
    }
  }
}
