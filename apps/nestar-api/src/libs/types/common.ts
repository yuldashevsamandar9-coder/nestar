export interface T {
	[key: string]: any;
}

import mongoose, { ObjectId } from 'mongoose';

export interface StatisticModifier {
	_id: mongoose.ObjectId;
	targetKey: string;
	modifier: number;
}
