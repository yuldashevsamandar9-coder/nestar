import { Injectable } from '@nestjs/common';

@Injectable()
export class BatchService {
	public async batchRollback(): Promise<void> {
		console.log('batchRollback');
	}

	public async batchProperties(): Promise<void> {
		console.log('batchProperties');
	}

	public async batchTopAgents(): Promise<void> {
		console.log('batchTopAgents');
	}

	getHello(): string {
		return 'Hello World NESTAR - BATCH Project';
	}
}
