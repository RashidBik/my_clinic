/**
 * تولید UUID v4
 * - در HTTPS/localhost: از crypto.randomUUID استفاده می‌کند
 * - در HTTP: از crypto.getRandomValues استفاده می‌کند (fallback امن)
 */
export function generateUUID(): string {
	// ۱. اگر crypto.randomUUID موجود است
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}

	// ۲. Fallback: استفاده از crypto.getRandomValues
	if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
		const bytes = new Uint8Array(16);
		crypto.getRandomValues(bytes);

		// UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
		bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
		bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10

		const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

		return [
			hex.slice(0, 8),
			hex.slice(8, 12),
			hex.slice(12, 16),
			hex.slice(16, 20),
			hex.slice(20, 32)
		].join('-');
	}

	// ۳. آخرین راه‌حل: Math.random (فقط اگر هیچ‌کدام نبود)
	console.warn('crypto API not available, using Math.random (NOT SECURE)');

	const timestamp = Date.now().toString(16);
	const random = () => Math.floor(Math.random() * 16).toString(16);

	return `${timestamp}-${random()}${random()}${random()}${random()}-4${random()}${random()}${random()}-${random()}${random()}${random()}-${random()}${random()}${random()}${random()}${random()}${random()}`;
}