import { ObjectId } from 'bson';

export const availebleAgentSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews', 'memberRank'];
export const availebleMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];
export const availeblePropertySorts = [
	'createdAt',
	'updatedAt',
	'propertyLikes',
	'propertyViews',
	'propertyRank, propertyPrice',
];
export const availableOptions = ['propertyBarter', 'propertyRent'];

/* IMAGE CONFIGURATION */
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
};

export const shapeIntoMongoObjectId = (target: any) => {
	return typeof target === 'string' ? new ObjectId(target) : target;
};

export const lookupMember = {
	$lookup: {
		from: 'members', // 1. Qaysi kolleksiyadan ma'lumot qidirilmoqda?
		localField: 'memberId', // 2. Hozirgi (boardarticles) kolleksiyadagi qaysi maydon ishlatiladi?
		foreignField: '_id', // 3. 'members' kolleksiyasidagi qaysi maydonga tenglashtiriladi?
		as: 'memberData', // 4. Birlashgan ma'lumot qaysi nomli massivga saqlansin?
	},
};
