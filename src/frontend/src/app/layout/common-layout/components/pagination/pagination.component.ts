import { Component, Input } from '@angular/core';
import { SeekPage } from '../../service/seek-page';
import { Router } from '@angular/router';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-pagination',
	templateUrl: './pagination.component.html',
	styleUrls: ['./pagination.component.css'],
})
export class PaginationComponent {
	@Input() page: SeekPage<any>;
	faAngleRight = faAngleRight;
	faAngleLeft = faAngleLeft;

	constructor(private router: Router) {}

	previous() {
		if (this.page.previous) {
			this.router.navigate([], {
				queryParams: { cursor: this.page.previous },
			});
		}
	}

	next() {
		if (this.page.next) {
			this.router.navigate([], {
				queryParams: { cursor: this.page.next },
			});
		}
	}
}
