import { createFeatureSelector } from '@ngrx/store';
import { CommonStateModel } from './common-state.model';

export const COMMON_STATE = 'commonState';

export const selectCommonState =
  createFeatureSelector<CommonStateModel>(COMMON_STATE);
