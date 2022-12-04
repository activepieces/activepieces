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

	hasPrevious() {
		return (this.page.endingBefore !== null && this.page.hasMore) || this.page.startingAfter !== null;
	}

	hasNext() {
		return (this.page.endingBefore === null && this.page.hasMore) || this.page.endingBefore !== null;
	}

	previous() {
		if (this.hasPrevious()) {
			this.router.navigate([], {
				queryParams: { endingBefore: this.page.data[0].id },
			});
		}
	}

	next() {
		if (this.hasNext()) {
			this.router.navigate([], {
				queryParams: { startingAfter: this.page.data[this.page.data.length - 1].id },
			});
		}
	}
}
