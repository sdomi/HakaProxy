const f = require('fastify');
const fs = require('fs');
const EventEmitter = require('events');

const emitter = new EventEmitter();
const app = f();
app.register(require('fastify-formbody'));

const messages = [];

const config = JSON.parse(fs.readFileSync('../config/config.json'));
const telegramConfig = JSON.parse(fs.readFileSync('../config/telegram.json'));
const { Client } = require('tdl');
const { TDLib } = require('tdl-tdlib-ffi');

const client = new Client(new TDLib('./libtdjson.so'), {
	apiId: telegramConfig.id,
	apiHash: telegramConfig.token,
});

client.connectAndLogin(() => ({
	getPhoneNumber: () => new Promise((resolve, reject) => {
		resolve(telegramConfig.user.number);
		reject(new TypeError('Invalid phone number'));
	}),
	getAuthCode: () => new Promise((resolve) => {
		emitter.once('code', resolve);
	}),
}));

app.post('/tgAuth', async (req, res) => {
	res.type('text/plain; charset=utf-8');
	emitter.emit('code', req.body.auth);
	return '';
});

app.post('/getContacts', async (req, res) => {
	res.type('text/plain; charset=utf-8');
	return JSON.stringify([{
		id: 'lauraiscute',
		name: 'lauraiscute',
		type: 'telegram',
	}]);
});

app.post('/getHistory', async (req, res) => {
	res.type('text/plain; charset=utf-8');
	return JSON.stringify(messages);
});

app.post('/sendMessage', async (req, res) => {
	res.type('text/plain; charset=utf-8');
	await client.invoke({
		_: 'sendMessage',
		chat_id: req.body.recipient,
		input_message_content: {
			_: 'inputMessageText',
			text: {
				_: 'formattedText',
				text: req.body.msg,
			},
		},
	});
	return '';
});

app.listen(config.port, config.ip, (err) => {
	console.log(err || 'Running!');
});

function messageHandler(msg) {
	if (msg._ === 'updateNewMessage') {
		// console.log(msg.message.content.photo.sizes[1]);
		messages.push({
			body: msg.message.content.text.text,
			timestamp: msg.message.date,
			room: 'lauraiscute',
			id: 'lauraiscute',
			sender: msg.message.sender_user_id,
			type: 'm.text',
		});
		// console.log(msg.message.content.text);
		// console.log(msg.message.content.photo);
	}
}

client.on('update', messageHandler);
