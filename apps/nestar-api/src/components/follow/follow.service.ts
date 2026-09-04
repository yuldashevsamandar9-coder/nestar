import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import FollowSchema from '../../schemas/Follow.model';
import { Follower, Following } from '../../libs/dto/follow/follow';
import { Model, Types } from 'mongoose';
import { MemberService } from '../member/member.service';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class FollowService {
	constructor(
		@InjectModel('Follow') private readonly followModel: Model<Follower | Following>,
		private readonly memberService: MemberService,
	) {}

	public async subscribe(followerId: Types.ObjectId, followingId: Types.ObjectId): Promise<Follower> {
		// 1. O'z-o'ziga obuna bo'lishni taqiqlash
		if (followerId.toString() === followingId.toString()) {
			throw new InternalServerErrorException(Message.SELF_SUBSCRIPTION_DENIED);
		}

		// 2. Obuna bo'linayotgan a'zo mavjudligini tekshirish
		const targetMember = await this.memberService.getMember(null as any, followingId);
		if (!targetMember) {
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		}

		// 3. Obunani saqlash (subscribe obyektini yaratish)
		const result = await this.registerSubscription(followerId, followingId);

		// 4. Statistikalarni yangilash (+1 oshirish)
		await this.memberService.memberStatsEditor({ _id: followerId as any, targetKey: 'memberFollowings', modifier: 1 });
		await this.memberService.memberStatsEditor({ _id: followingId as any, targetKey: 'memberFollowers', modifier: 1 });

		return result;
	}
	registerSubscription(followerId: Types.ObjectId, followingId: Types.ObjectId) {
		throw new Error('Method not implemented.');
	}
}
