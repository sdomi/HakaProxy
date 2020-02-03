var sdk = require("matrix-js-sdk");
const f = require('fastify')
const fs = require('fs');
const app = f()
app.register(require('fastify-formbody'))

var config = JSON.parse(fs.readFileSync('config/config.json'));
var contacts = JSON.parse(fs.readFileSync('config/contacts.json'));
var messages = {}
messages.matrix = []

const matrixConfig = JSON.parse(fs.readFileSync("config/matrix.json"))
const matrixClient = sdk.createClient({
	baseUrl: matrixConfig.well_known['m.homeserver'].base_url,
	accessToken: matrixConfig.access_token,
	userId: matrixConfig.user_id
});

matrixClient.on("Room.timeline", function(event, room, toStartOfTimeline) {
	if (toStartOfTimeline) {
		return;
	}
	if (event.getType() !== "m.room.message") {
		return;
	}
	messages.matrix.push([room.name, room.roomId, event.getSender(), event.getContent().body])
});

async function startMatrix () {
	matrixClient.startClient({initialSyncLimit: 100});
}

app.get('/', async (req, res) => {
	res.type('text/html')
	return `asdf`
})

app.post('/getContacts', async (req, res) => {
	res.type('text/plain; charset=utf-8')
	if(req.body.token==config.token) {
		switch(req.body.type) {
			case 'matrix':
				rooms=matrixClient.getRooms()
				rooms.forEach(function(element) { // element map is CONFUSIGN
					contacts[element.roomId]={"id": element.roomId, "name": element.name, "type": "matrix"}
				});
				deduplicated=[]
				Object.entries(contacts).forEach(function(element) {
					deduplicated.push(element[1])
				})
				return JSON.stringify(deduplicated)
				break
			default:
				return ''
				break
		}
	} else {
		return config.invalidTokenMessage
	}
})

app.post('/getHistory', async (req, res) => {
	if(req.body.token==config.token) {
		switch(req.body.type) {
			case 'matrix':
				res.type('text/plain; charset=utf-8')
				filtered=[]
				messages.matrix.forEach(function(element) {
					if(element[1]==req.body.number) {
						filtered.push(element)
					}
				})
				return JSON.stringify(filtered)
				break
			default:
				return ''
				break
		}
	} else {
		return config.invalidTokenMessage
	}
})

app.post('/sendMessage', async (req, res) => {
	if(req.body.token==config.token) {
		switch(req.body.type) {
			case 'matrix':
				matrixClient.sendEvent(req.body.recipient, "m.room.message", { "body": req.body.msg, "msgtype": "m.text"}, "", (err, res) => {
					console.log(err);
				})
				break
		}
		return ''
	} else {
		return config.invalidTokenMessage
	}
})

app.listen(config.port, config.ip, (err) => {
	console.log(err || 'Running!')
})

startMatrix()
