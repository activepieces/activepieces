import {slack} from './slack';
import type {Component} from '../framework/component';
import {github} from "./github";
import { gmail } from './gmail';
import { googleSheets } from './google-sheets';

export const apps: Component[] = [
	slack,
	github,
	gmail,
	googleSheets
];
