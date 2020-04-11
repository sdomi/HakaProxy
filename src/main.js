const f = require('fastify');
const fastifyFormBody = require('fastify-formbody');
const ow = require('ow');
const fs = require('fs');
const path = require('path');

const app = f();
app.register(fastifyFormBody);

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'config', 'config.json')));

const services = new Map();

config.services.forEach(async (serviceName) => {
	// eslint-disable-next-line import/no-dynamic-require, global-require
	const RawService = require(path.resolve(__dirname, 'services', serviceName, serviceName));
	const service = new RawService(JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'config', `${serviceName}.json`))));
	await service.start();
	services.set(serviceName, service);
});

app.addHook('preValidation', (req, reply, next) => {
	if (req.body && req.body.token === config.token) {
		ow(req.body.service, 'service', ow.string);
		const service = services.get(req.body.service) || null;
		if (service) {
			req.service = service;
			next();
		} else {
			next({ code: 400, message: 'Invalid service name' });
		}
	}
	next();
});

app.addHook('preSerialization', (req, reply, data, done) => {
	const wrapped = { data };
	done(null, wrapped);
});

app.addHook('onError', (req, reply, error, done) => {
	done(null, {
		error: {
			code: error.statusCode,
			message: error.name,
		},
	});
});

app.post('/getContacts', async (req, reply) => {
	reply.send(await req.service.getContacts());
});

app.post('/getHistory', async (req, reply) => {
	const { contactID } = req.body;
	ow(contactID, ow.string.nonEmpty);
	reply.send(await req.service.getHistory(contactID));
});

app.post('/sendMessage', async (req, reply) => {
	const { recipient, body } = req.body;
	ow(recipient, ow.string.nonEmpty);
	ow(body, ow.string);
	reply.send(await req.service.sendMessage({ recipient, body }));
});

app.listen(config.port, config.ip, (err) => {
	console.log(err || 'Running!');
});
