import {  ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, tap } from 'rxjs';
import { EmbeddingService } from '../embedding.service';
@Component({
  selector: 'ap-embed-redirect',
  templateUrl: './embed-redirect.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbedRedirectComponent implements OnDestroy,OnInit {
  validateJWT$?: Observable<string>;
  showError = false;
  constructor(
    private route: ActivatedRoute,
    private embeddingService: EmbeddingService,
    private router: Router
  ) {

    
  }

  ngOnInit(): void {
    const jwt = this.route.snapshot.queryParamMap.get('jwt');

    // if (jwt === null) {
    //   throw new Error('Activepieces: no provided jwt token');
    // }
    //TODO: handle erroring and storing new JWT token

    this.validateJWT$ = of(jwt || '').pipe(
      tap(() => {
        window.parent.postMessage(
          {
            type: 'CLIENT_INIT',
          },
          '*'
        );

        window.addEventListener(
          'message',
          this.initializedVendorHandler
        );
      })
    );
  }


  initializedVendorHandler = (
    event: MessageEvent<{
      type: 'VENDOR_INIT';
      data: {
        prefix: string;
        initialClientRoute: string;
      };
    }>
  ) => {
 
    const hideSidebar =
      this.route.snapshot.queryParamMap
        .get('hideSidebar')
        ?.toLocaleLowerCase() === 'TRUE'.toLocaleLowerCase();

    if (event.source === window.parent && event.data.type === 'VENDOR_INIT') {
      this.embeddingService.setState({
        hideSideNav:hideSidebar,isEmbedded:true,prefix:event.data.data.prefix
      })
      this.router.navigate([event.data.data.initialClientRoute],{skipLocationChange:true});
    }
  };

  ngOnDestroy(): void {
    window.removeEventListener('message', this.initializedVendorHandler);
  }
}
