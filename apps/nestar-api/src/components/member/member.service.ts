import { Injectable } from '@nestjs/common';

@Injectable()
export class MemberService {
	public async signup(): Promise<string> {
		return `Singup excuted`;
	}

	public async login(): Promise<string> {
		return `login excuted`;
	}

	public async updateMember(): Promise<string> {
		return `updateMember excuted`;
	}

	public async getMember(): Promise<string> {
		return 'getMember excuted';
	}
}
