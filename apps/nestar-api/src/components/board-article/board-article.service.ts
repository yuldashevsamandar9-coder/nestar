import { BadRequestException, Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { BoardArticle } from '../../libs/dto/board-article/board-article';
import { InjectModel } from '@nestjs/mongoose';
import { MemberService } from '../member/member.service';
import { BoardArticleInput } from '../../libs/dto/board-article/board-article.input';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class BoardArticleService {
	constructor(
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
		private readonly memberService: MemberService,
	) {}

	public async createBoardArticle(memberId: Types.ObjectId, input: BoardArticleInput): Promise<BoardArticle> {
		// 1-qadam: Maqola kiritayotgan foydalanuvchi ID sini input ichiga joylash
		input.memberId = memberId as any;

		try {
			// 2-qadam: Baza (MongoDB) ga yangi maqolani saqlash
			const result = await this.boardArticleModel.create(input);

			// 3-qadam: Maqola yozgan foydalanuvchining maqolalar sonini +1 ga oshirish
			await this.memberService.memberStatsEditor({
				_id: memberId as any,
				targetKey: 'memberArticles',
				modifier: 1,
			});

			// 4-qadam: Yaratilgan maqola ma'lumotlarini qaytarish
			return result;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}
}
