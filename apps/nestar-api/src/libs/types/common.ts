export interface T {
	[key: string]: any;
}

import { ObjectId } from 'mongoose';

export interface StatisticModifier {
	_id: ObjectId;
	targetKey: string;
	modifier: number;
}
