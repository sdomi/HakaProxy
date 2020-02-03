const sdk = require('matrix-js-sdk');
const f = require('fastify');
const fs = require('fs');

const app = f();
app.register(require('fastify-formbody'));

const config = JSON.parse(fs.readFileSync('config/config.json'));
const contacts = JSON.parse(fs.readFileSync('config/contacts.json'));
const messages = {};
messages.matrix = [];

const matrixConfig = JSON.parse(fs.readFileSync('config/matrix.json'));
const matrixClient = sdk.createClient({
	baseUrl: matrixConfig.well_known['m.homeserver'].base_url,
	accessToken: matrixConfig.access_token,
	userId: matrixConfig.user_id,
});

matrixClient.on('Room.timeline', (event, room, toStartOfTimeline) => {
	if (toStartOfTimeline) {
		return;
	}
	if (event.getType() !== 'm.room.message') {
		return;
	}
	messages.matrix.push([room.name, room.roomId, event.getSender(), event.getContent().body]);
});

async function startMatrix() {
	matrixClient.startClient({ initialSyncLimit: 100 });
}

app.get('/', async (req, res) => {
	res.type('text/html');
	return 'asdf';
});

app.post('/getContacts', async (req, res) => {
	res.type('text/plain; charset=utf-8');
	if (req.body.token === config.token) {
		switch (req.body.type) {
		case 'matrix': {
			matrixClient.getRooms().forEach((element) => { // element map is CONFUSIGN
				contacts[element.roomId] = { id: element.roomId, name: element.name, type: 'matrix' };
			});
			const deduplicated = [];
			Object.entries(contacts).forEach((element) => {
				deduplicated.push(element[1]);
			});
			return JSON.stringify(deduplicated);
		}
		default:
			return '';
		}
	} else {
		return config.invalidTokenMessage;
	}
});

app.post('/getHistory', async (req, res) => {
	if (req.body.token === config.token) {
		switch (req.body.type) {
		case 'matrix': {
			res.type('text/plain; charset=utf-8');
			const filtered = [];
			messages.matrix.forEach((element) => {
				if (element[1] === req.body.number) {
					filtered.push(element);
				}
			});
			return JSON.stringify(filtered);
		}
		default:
			return '';
		}
	} else {
		return config.invalidTokenMessage;
	}
});

app.post('/sendMessage', async (req) => {
	if (req.body.token === config.token) {
		switch (req.body.type) {
		case 'matrix':
			matrixClient.sendEvent(req.body.recipient, 'm.room.message', { body: req.body.msg, msgtype: 'm.text' }, '', (err) => {
				console.log(err);
			});
			break;
		default:
			return '';
		}
		return '';
	}
	return config.invalidTokenMessage;
});

app.listen(config.port, config.ip, (err) => {
	console.log(err || 'Running!');
});

startMatrix();
