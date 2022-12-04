import { Injectable } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpErrorResponse, HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { StatusCodes } from 'http-status-codes';
import { ErrorCode, ErrorMessage } from '../model/error-message';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root',
})
export class HttpInterceptorService {
	constructor(private router: Router) {}

	intercept(request: HttpRequest<any>, _next: HttpHandler): Observable<HttpEvent<any>> {
		return _next.handle(request).pipe(
			tap({
				error: res => {
					switch (res.status) {
						case StatusCodes.UNAUTHORIZED: {
							const errorMessage = res.error as ErrorMessage;
							if (errorMessage.errorCode == ErrorCode.USER_TRIAL_EXPIRED) {
								this.router.navigate(['/trial-status']).then(value => {});
							}
							break;
						}
						//Unknown error
						case 0: {
						}
					}
				},
			}),
			catchError((error: HttpErrorResponse) => {
				return throwError(error);
			})
		);
	}
}

export const HttpInterceptorProvider = {
	provide: HTTP_INTERCEPTORS,
	useClass: HttpInterceptorService,
	multi: true,
	deps: [Router],
};
