import fp from 'fastify-plugin';

export default fp(async (app) => {
	// Logger already configured in Fastify constructor
	// This plugin exists for future extensions (e.g., Log to file)
}, {
	name: 'logger-plugin'
});