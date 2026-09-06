import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { LikeInput } from '../../libs/dto/like/like.input';
import { T } from '../../libs/types/common';
import { Message } from '../../libs/enums/common.enum';
import { OrdinaryInquiry } from '../../libs/dto/property/property.input';
import { Properties } from '../../libs/dto/property/property';
import { LikeGroup } from '../../libs/enums/like.enum';
import { lookupFavorite } from '../../libs/config';

@Injectable()
export class LikeService {
	constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) {}

	public async toggleLike(input: LikeInput): Promise<number> {
		const search: T = { memberId: input.memberId, likeRefId: input.likeRefId },
			exist = await this.likeModel.findOne(search).exec();

		let modifier = 1;
		if (exist) {
			await this.likeModel.findOneAndDelete(search).exec();
			let modifier = -1;
		} else {
			try {
				await this.likeModel.create(input);
			} catch (err) {
				console.log('Error: Service Model', err.message);
				throw new BadRequestException(Message.CREATE_FAILED);
			}
		}
		console.log(`--LikeModifier ${modifier} --`);

		return modifier;
	}

	public async checkLikeExistence(input: LikeInput): Promise<MeLiked[]> {
		const { memberId, likeRefId } = input;

		const result = await this.likeModel.findOne({ memberId: memberId, likeRefId: likeRefId }).exec();

		return result ? [{ memberId, likeRefId, myFavorite: true }] : [];
	}

	public async getFavoriteProperties(memberId: Types.ObjectId, input: OrdinaryInquiry): Promise<Properties> {
		const { page, limit } = input;
		const match: T = { likeGroup: LikeGroup.PROPERTY, memberId: memberId };

		const data: T = await this.likeModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'properties', //shundan
						localField: 'likeRefId', //qabul qlib propertilarimiz
						foreignField: '_id', // idi nomi bn izlash
						as: 'favoriteProperty', // shu nom bn saqlash
					},
				},
				{ $unwind: '$favoriteProperty' }, // yani oddiy arayni ichidan tashqariga chqarishni talab qilmoqdamiz
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupFavorite,
							{ $unwind: '$favoriteProperty.memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const result: Properties = { list: [], metaCounter: data[0].metaCounter };
		result.list = data[0].list.map((ele) => ele.favoriteProperty);

		return result;
	}
}
