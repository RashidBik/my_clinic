import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

// ═══════════════════════════════════════════════
// Hash
// ═══════════════════════════════════════════════

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(SALT_LENGTH).toString('hex');
	const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
	return `${salt}:${derivedKey.toString('hex')}`;
}

// ═══════════════════════════════════════════════
// Verify
// ═══════════════════════════════════════════════

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	const [salt, key] = hash.split(':');
	if (!salt || !key) return false;
	
	const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
	const keyBuffer = Buffer.from(key, 'hex');
	
	// جلوگیری از Timing Attack
	return timingSafeEqual(derivedKey, keyBuffer);
}