import { environment } from 'packages/frontend/src/environments/environment';

export function tokenGetter() {
	const jwtToken: any = localStorage.getItem(environment.jwtTokenName);

	return jwtToken;
}
export function download(filename, text) {
	const element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}
