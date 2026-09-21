export interface Member {
	id: string;
	userId: string;
	name: string;
	phone: string;
	avatar: string | null;
	roleId: string;
	roleName: string;
	roleSlug: string;
	baseRole: string;
	isMember: boolean;
	status: 'active' | 'inactive' | 'suspended';
	joinedAt: string;
	lastLoginAt: string | null;
}

export interface Role {
	id: string;
	name: string;
	slug: string;
	baseRole: string;
	description: string | null;
	permissions: string[];
	isActive: boolean;
}