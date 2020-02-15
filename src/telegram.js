const f = require('fastify');
const fs = require('fs');

const EventEmitter = require('events');

const emitter = new EventEmitter();

const app = f();
app.register(require('fastify-formbody'));

const config = JSON.parse(fs.readFileSync('../config/telegram.json'));
const { Client } = require('tdl');
const { TDLib } = require('tdl-tdlib-ffi');

const client = new Client(new TDLib(), {
	apiId: config.id, // Your api_id
	apiHash: config.token, // Your api_hash
});

auth = 1337;

client.connectAndLogin(() => ({
	getPhoneNumber: (retry) => (retry
		? Promise.reject('Invalid phone number')
		: Promise.resolve(config.user.number)),
	getAuthCode: (retry) => new Promise((resolve, reject) => {
		emitter.once('code', resolve);
	}),


}));

client.on('update', messageHandler);

app.post('/tgAuth', async (req, res) => {
	emitter.emit('code', req.body.auth);
	return '';
});

app.listen(8888, '0.0.0.0.', (err) => {
	console.log(err || 'Running!');
});

function messageHandler(msg) {
//	console.log(msg._)
	if (msg._ == 'updateNewMessage') {
		console.log('asdf');
		console.log(msg);
		console.log(msg.message.content.text);
	}
}
