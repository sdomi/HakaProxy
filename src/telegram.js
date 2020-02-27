const f = require('fastify');
const fs = require('fs');

const EventEmitter = require('events');

const emitter = new EventEmitter();

const app = f();
app.register(require('fastify-formbody'));

messages = []

const config = JSON.parse(fs.readFileSync('../config/config.json'));
const telegram_config = JSON.parse(fs.readFileSync('../config/telegram.json'));
const { Client } = require('tdl');
const { TDLib } = require('tdl-tdlib-ffi');

const client = new Client(new TDLib('./libtdjson.so'), {
	apiId: telegram_config.id, // Your api_id
	apiHash: telegram_config.token, // Your api_hash
});

auth = 1337;

client.connectAndLogin(() => ({
	getPhoneNumber: (retry) => (retry
		? Promise.reject('Invalid phone number')
		: Promise.resolve(telegram_config.user.number)),
	getAuthCode: (retry) => new Promise((resolve, reject) => {
		emitter.once('code', resolve);
	}),
}));

client.on('update', messageHandler);

app.post('/tgAuth', async (req, res) => {
	emitter.emit('code', req.body.auth);
	return '';
});

app.post('/getContacts', async (req, res) => {
	res.type('text/plain; charset=utf-8');
	return JSON.stringify([{id:"lauraiscute",
				name:"lauraiscute",
				type:"telegram"
				}]);
});

app.post('/getHistory', async (req, res) => {
	res.type('text/plain; charset=utf-8');
	return JSON.stringify(messages);
});

app.post('/sendMessage', async (req, res) => {
	// req.body.recipient, req.body.msg
	return '';
});

app.listen(8888, '0.0.0.0.', (err) => {
	console.log(err || 'Running!');
});

function messageHandler(msg) {
	if (msg._ == 'updateNewMessage') {
		console.log(msg);
		messages.push({body: msg.message.content.text.text,
			       timestamp: msg.message.date,
			       room: "lauraiscute",
			       id: "lauraiscute",
			       sender: msg.message.sender_user_id,
			       type: "m.text"}
);
		console.log(msg.message.content.text);
	}
}
