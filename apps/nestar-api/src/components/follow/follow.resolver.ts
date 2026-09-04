import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { FollowService } from './follow.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UseGuards } from '@nestjs/common';
import { Follower } from '../../libs/dto/follow/follow';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Types } from 'mongoose';

@Resolver()
export class FollowResolver {
	constructor(private readonly followService: FollowService) {}

	@UseGuards(AuthGuard)
	@Mutation((returns) => Follower)
	public async subscribe(@Args('input') input: string, @AuthMember('_id') memberId: Types.ObjectId): Promise<Follower> {
		console.log('Mutation: subscribe');
		const followingId = shapeIntoMongoObjectId(input);
		return await this.followService.subscribe(memberId, followingId);
	}
}
