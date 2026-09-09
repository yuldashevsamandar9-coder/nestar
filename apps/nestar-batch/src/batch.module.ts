import { Module } from '@nestjs/common';
import { BatchController as BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import PropertyModel from 'apps/nestar-api/src/schemas/Property.model';
import { MemberModule } from 'apps/nestar-api/src/components/member/member.module';
import { PropertyModule } from 'apps/nestar-api/src/components/property/property.module';
import PropertySchema from 'apps/nestar-api/src/schemas/Property.model';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from 'apps/nestar-api/src/schemas/Member.modul';

@Module({
	imports: [
		ConfigModule.forRoot(),
		DatabaseModule,
		ScheduleModule.forRoot(),
		MongooseModule.forFeature([
			{ name: 'Property', schema: PropertySchema },
			{ name: 'Member', schema: MemberSchema },
		]),
	],
	controllers: [BatchController],
	providers: [BatchService],
})
export class BatchModule {}
