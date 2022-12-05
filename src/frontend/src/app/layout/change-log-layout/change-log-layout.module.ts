import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeLogComponent } from './change-log/change-log.component';
import { MarkdownModule } from 'ngx-markdown';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { ChangeLogLayoutRouting } from './change-log-layout.routing';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@NgModule({
	declarations: [ChangeLogComponent],
	imports: [
		CommonModule,
		MarkdownModule,
		RouterModule.forChild(ChangeLogLayoutRouting),
		MatToolbarModule,
		HttpClientModule,
		MarkdownModule.forRoot({
			loader: HttpClient, // optional, only if you use [src] attribute
		}),
	],
})
export class ChangeLogLayoutModule {}
