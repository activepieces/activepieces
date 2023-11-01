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

  navigate(route: string, openInNewWindow: boolean) {
    if (this.embeddingService.getState().isEmbedded || !openInNewWindow) {
      this.router.navigate([route]);
    } else {
      const url = this.router.serializeUrl(this.router.createUrlTree([route]));
      window.open(url, '_blank', 'noopener');
    }
  }
}
