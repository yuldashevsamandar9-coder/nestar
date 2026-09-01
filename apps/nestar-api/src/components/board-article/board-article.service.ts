import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { BoardArticle, BoardArticles } from '../../libs/dto/board-article/board-article';
import { InjectModel } from '@nestjs/mongoose';
import { MemberService } from '../member/member.service';
import { BoardArticleInput, BoardArticlesInquiry } from '../../libs/dto/board-article/board-article.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ViewService } from '../view/view.service';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import { BoardArticleUpdate } from '../../libs/dto/board-article/board-article.update';
import { lookupMember, shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class BoardArticleService {
	constructor(
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
		private readonly memberService: MemberService,
		private readonly viewService: ViewService,
	) {}

	public async createBoardArticle(memberId: Types.ObjectId, input: BoardArticleInput): Promise<BoardArticle> {
		// 1-qadam: Maqola kiritayotgan foydalanuvchi ID sini input ichiga joylash
		input.memberId = memberId as any; // input.memberId Auth bulgan

		try {
			// 2-qadam: Baza (MongoDB) ga yangi maqolani saqlash
			const result = await this.boardArticleModel.create(input);

			// 3-qadam: Maqola yozgan foydalanuvchining maqolalar sonini +1 ga oshirish
			await this.memberService.memberStatsEditor({
				_id: memberId as any,
				targetKey: 'memberArticles',
				modifier: 1,
			});

			// 4-qadam: Yaratilgan maqola ma'lumotlarini qaytarish //
			return result;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getBoardArticle(memberId: Types.ObjectId, articleId: Types.ObjectId): Promise<BoardArticle> {
		const search: T = {
			_id: articleId,
			articleStatus: BoardArticleStatus.ACTIVE,
		};

		const targetBoardArticle = await this.boardArticleModel.findOne(search).lean().exec();
		if (!targetBoardArticle) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: articleId, viewGroup: ViewGroup.ARTICLE };
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.boardArticleStatsEditor({ _id: articleId as any, targetKey: 'articleViews', modifier: 1 });
				targetBoardArticle.articleViews++;
			}
		}

		// meLiked

		targetBoardArticle.memberData = await this.memberService.getMember(null as any, targetBoardArticle.memberId);
		return targetBoardArticle;
	}

	public async updateBoardArticle(memberId: Types.ObjectId, input: BoardArticleUpdate): Promise<BoardArticle> {
		const { _id, articleStatus } = input;

		const result = await this.boardArticleModel
			.findOneAndUpdate({ _id: _id, memberId: memberId, articleStatus: BoardArticleStatus.ACTIVE }, input, {
				new: true,
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (articleStatus === BoardArticleStatus.DELETE) {
			await this.memberService.memberStatsEditor({
				_id: memberId as any,
				targetKey: 'memberArticles',
				modifier: -1,
			});
		}

		return result;
	}

	public async getBoardArticles(memberId: Types.ObjectId, input: BoardArticlesInquiry): Promise<BoardArticles> {
		const { articleCategory, text } = input.search;
		const match: T = { articleStatus: BoardArticleStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (articleCategory) match.articleCategory = articleCategory;
		if (text) match.articleTitle = { $regex: new RegExp(text, 'i') };
		if (input.search?.memberId) {
			match.memberId = shapeIntoMongoObjectId(input.search.memberId);
		}

		console.log('match:', match);

		const result = await this.boardArticleModel
			.aggregate([
				{ $match: match }, // 1. Filterga tushgan maqolalarnigina saralab olish
				{ $sort: sort }, // 2. Belgilangan tartib bo'yicha saralash
				{
					$facet: {
						// 3. Bir vaqtning o'zida 2 xil so'rovni parallel bajarish
						list: [
							{ $skip: (input.page - 1) * input.limit }, // Sahifalash: masalan 2-sahifa bo'lsa, birinchi 10 tasini o'tkazib yuborish
							{ $limit: input.limit }, // Sahifadagi maqolalar sonini chegaralash (masalan, 10 ta)
							lookupMember, // Maqola muallifi ma'lumotlarini 'members' kolleksiyasidan biriktirish ($lookup)
							{
								$unwind: '$memberData',
							}, // $lookup bergan massivni bitta obyekt ko'rinishiga keltirish
						],
						metaCounter: [{ $count: 'total' }], // Qidiruvga tushgan umumiy maqolalar sonini hisoblash (Pagination uchun kerak)
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async boardArticleStatsEditor(input: StatisticModifier): Promise<BoardArticle | null> {
		const { _id, targetKey, modifier } = input;
		return await this.boardArticleModel
			.findByIdAndUpdate(
				_id,
				{ $inc: { [targetKey]: modifier } },
				{
					new: true,
				},
			)
			.exec();
	}
}
