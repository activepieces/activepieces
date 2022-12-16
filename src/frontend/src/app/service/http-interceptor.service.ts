import { Injectable } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpErrorResponse, HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { StatusCodes } from 'http-status-codes';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root',
})
export class HttpInterceptorService {
	constructor() {}

	intercept(request: HttpRequest<any>, _next: HttpHandler): Observable<HttpEvent<any>> {
		return _next.handle(request).pipe(
			tap({
				error: res => {
					switch (res.status) {
						case StatusCodes.UNAUTHORIZED: {
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
