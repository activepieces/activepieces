import {slack} from './slack';
import type {Component} from '../framework/component';
import { gmail } from './gmail';
import { facebook } from './facebook';

export const apps: Component[] = [
	slack,
	gmail,
	facebook
];
