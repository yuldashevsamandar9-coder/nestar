import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import FollowSchema from '../../schemas/Follow.model';
import { Follower, Followers, Following, Followings } from '../../libs/dto/follow/follow';
import { Model, Types } from 'mongoose';
import { MemberService } from '../member/member.service';
import { Direction, Message } from '../../libs/enums/common.enum';
import { lookupFollowerData, lookupFollowingData } from '../../libs/config';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';
import { T } from '../../libs/types/common';

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

		return result as any;
	}
	public async registerSubscription(followerId: Types.ObjectId, followingId: Types.ObjectId): Promise<Follower> {
		const input = {
			followerId,
			followingId,
		};

		const result = await this.followModel.create(input);

		return result;
	}

	public async unsubscribe(followerId: Types.ObjectId, followingId: Types.ObjectId): Promise<Follower> {
		const targetMember = await this.memberService.getMember(null as any, followingId);
		if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const result = await this.followModel.findOneAndDelete({
			followingId: followingId,
			followerId: followerId,
		});
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		await this.memberService.memberStatsEditor({ _id: followerId as any, targetKey: 'memberFollowings', modifier: -1 });
		await this.memberService.memberStatsEditor({ _id: followingId as any, targetKey: 'memberFollowers', modifier: -1 });

		return result;
	}

	public async getMemberFollowings(memberId: Types.ObjectId, input: FollowInquiry): Promise<Followings> {
		const { page, limit, search } = input;
		if (!search?.followerId) throw new InternalServerErrorException(Message.BAD_REQUEST);
		const match: T = { followerId: search?.followerId };
		console.log('match:', match);

		const result = await this.followModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: Direction.DESC } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							// meLiked
							// meFollowed
							lookupFollowingData,
							{ $unwind: '$followingData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async getMemberFollowers(memberId: Types.ObjectId, input: FollowInquiry): Promise<Followers> {
		const { page, limit, search } = input;
		if (!search?.followingId) throw new InternalServerErrorException(Message.BAD_REQUEST);

		const match: T = { followingId: search?.followingId };
		console.log('match:', match);

		const result = await this.followModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: Direction.DESC } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							// meLiked
							// meFollowed
							lookupFollowerData,
							{ $unwind: '$followerData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}
}
