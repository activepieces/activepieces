import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const routes: Routes = [];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, {
			urlUpdateStrategy: 'eager',
		}),
	],
	exports: [RouterModule],
})
export class AppRoutingModule { }

