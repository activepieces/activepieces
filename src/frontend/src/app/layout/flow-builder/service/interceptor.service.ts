import { Injectable } from '@angular/core';
import {
	HTTP_INTERCEPTORS,
	HttpErrorResponse,
	HttpEvent,
	HttpHandler,
	HttpRequest,
	HttpInterceptor,
} from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { StatusCodes } from 'http-status-codes';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root',
})
export class HttpInterceptorService implements HttpInterceptor {
	constructor(private router: Router) {}

	intercept(request: HttpRequest<any>, _next: HttpHandler): Observable<HttpEvent<any>> {
		return _next.handle(request).pipe(
			tap({
				error: res => {
					debugger;
					switch (res.status) {
						case StatusCodes.UNAUTHORIZED: {
							let errorMessage = res.error;
							console.error(errorMessage);
							localStorage.clear();
							this.router.navigate(['/']);
							break;
						}
					}
				},
			}),
			catchError((error: HttpErrorResponse) => {
				return throwError(() => {
					return error;
				});
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
