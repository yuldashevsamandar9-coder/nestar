import { Controller, Get, Logger } from '@nestjs/common';
import { BatchService } from './batch.service';
import { Cron, Interval, Timeout } from '@nestjs/schedule';

@Controller()
export class BatchController {
	private logger: Logger = new Logger('BatchController');
	[x: string]: any;
	constructor(private readonly batchService: BatchService) {}

	// @Interval(1000)
	@Timeout(1000)
	handleInterval() {
		this.logger.debug('BATCH SERVER READY');
	}
	@Cron('00 * * * * * ', { name: 'batchRollback' })
	public async batchRollback() {
		try {
			this.logger['Context'] = 'batchRollback ';
			this.logger.debug('EXECUTED!');
			await this.batchService.batchRollback();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('20  * * * * * ', { name: 'BATCH_TOP_PROPERTIES' })
	public async batchProperties() {
		try {
			this.logger['Context'] = 'BATCH_TOP_PROPERTIES';
			this.logger.debug('EXECUTED!');
			await this.batchService.batchProperties();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('40  * * * * * ', { name: 'BATCH_TOP_AGENTS' })
	public async batchTopAgents() {
		try {
			this.logger['Context'] = 'BATCH_TOP_AGENTS';
			this.logger.debug('EXECUTED!');
			await this.batchService.batchTopAgents();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Get()
	getHello(): string {
		return this.BatchService.getHello();
	}
}
