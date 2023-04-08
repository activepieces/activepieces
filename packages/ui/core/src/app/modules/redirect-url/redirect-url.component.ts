import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, tap } from 'rxjs';

@Component({
  selector: 'app-redirect-url',
  templateUrl: './redirect-url.component.html',
  styleUrls: ['./redirect-url.component.css'],
})
export class RedirectUrlComponent implements OnInit {
  sendCodeFromIFrame$: Observable<void> = new Observable<void>();
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.sendCodeFromIFrame$ = this.route.queryParams
      .pipe(
        tap((params) => {
          if (window.opener && params['code'] != undefined) {
            window.opener.postMessage(
              {
                code: params['code'],
              },
              '*'
            );
          }
        })
      )
      .pipe(map(() => void 0));
  }
}
