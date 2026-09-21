import type { Server as HttpServer } from 'node:http';
import { Server as SocketServer, type Socket } from 'socket.io';
import { verifyAccessToken, type AccessTokenPayload } from '../services/jwt.js';
import { env } from '../config/env.js';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

interface AuthenticatedSocket extends Socket {
	user?: AccessTokenPayload;
}

// ═══════════════════════════════════════════════
// Setup
// ═══════════════════════════════════════════════

export function setupSocketIO(httpServer: HttpServer): SocketServer {
	const io = new SocketServer(httpServer, {
		cors: {
			origin: env.NODE_ENV === 'development'
				? true
				: [
					/^https?:\/\/localhost(:\d+)?$/,
					/^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
					/^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/
				],
			credentials: true
		},
		path: '/socket.io',
		transports: ['websocket', 'polling']
	});
	
	// ═══════════════════════════════════════════════
	// Auth Middleware
	// ═══════════════════════════════════════════════
	
	io.use(async (socket: AuthenticatedSocket, next) => {
		try {
			const token = socket.handshake.auth.token;
			
			if (!token || typeof token !== 'string') {
				return next(new Error('NO_TOKEN'));
			}
			
			const payload = await verifyAccessToken(token);
			
			if (!payload.isMember) {
				return next(new Error('NOT_A_MEMBER'));
			}
			
			socket.user = payload;
			next();
		} catch {
			next(new Error('INVALID_TOKEN'));
		}
	});
	
	// ═══════════════════════════════════════════════
	// Connection
	// ═══════════════════════════════════════════════
	
	io.on('connection', (socket: AuthenticatedSocket) => {
		const user = socket.user!;
		const orgRoom = `org:${user.orgId}`;
		const userRoom = `user:${user.sub}`;
		
		console.log(`✅ Socket connected: ${user.sub} (${user.roleSlug})`);
		
		// Join rooms
		socket.join(orgRoom);
		socket.join(userRoom);
		
		// ═══════════════════════════════════════════
		// Events
		// ═══════════════════════════════════════════
		
		// ping/pong برای تست
		socket.on('ping', (callback) => {
			if (typeof callback === 'function') {
				callback({ pong: true, ts: Date.now() });
			}
		});
		
		// typing indicator
		socket.on('chat:typing', (data: { isTyping: boolean }) => {
			socket.to(orgRoom).emit('chat:typing', {
				userId: user.sub,
				roleSlug: user.roleSlug,
				isTyping: data.isTyping
			});
		});
		
		// read receipt
		socket.on('chat:read', (data: { messageId: string }) => {
			// TODO: ذخیره در DB
		});
		
		// ═══════════════════════════════════════════
		// Disconnect
		// ═══════════════════════════════════════════
		
		socket.on('disconnect', (reason) => {
			console.log(`❌ Socket disconnected: ${user.sub} (${reason})`);
		});
	});
	
	return io;
}