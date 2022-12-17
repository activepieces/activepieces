import {slack} from './slack';
import type {Component} from '../framework/component';
import {github} from "./github";

export const apps: Component[] = [
	slack,
	github
];
