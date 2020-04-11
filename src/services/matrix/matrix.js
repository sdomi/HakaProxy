const sdk = require('matrix-js-sdk');

module.exports = class Matrix {
	constructor(config) {
		this.config = config;
		this.client = sdk.createClient({
			baseUrl: this.config.well_known['m.homeserver'].base_url,
			accessToken: this.config.access_token,
			userId: this.config.user_id,
		});
	}

	async start() {
		await this.client.startClient({ initialSyncLimit: 100 });
	}

	messageExternalToInternal(event, room) {
		if (event.getType() !== 'm.room.message') {
			return null;
		}
		const timestamp = Math.floor(event.getTs() / 1000);
		const file = event.getContent().url ? event.getContent().url.substring(6) : null;
		const homeserver = this.config.well_known['m.homeserver'].base_url;
		return {
			room: room.name,
			id: room.roomId,
			sender: event.getSender(),
			type: event.getContent().msgtype,
			body: event.getContent().body,
			timestamp,
			images: file ? [{
				orig: `${homeserver}/_matrix/media/r0/download/${file}`,
				thumb: `${homeserver}/_matrix/media/r0/thumbnail/${file}?width=256&height=-1`,
				name: file,
			}] : [],
		};
	}

	async getContacts() {
		return this.client.getVisibleRooms()
			.map((element) => ({
				id: element.roomId,
				name: element.name,
				type: 'matrix',
			}));
	}

	async getHistory(contactID) {
		const room = this.client.getRoom(contactID);
		return room.timeline
			.filter((event) => event.getType() === 'm.room.message')
			.map((event) => this.messageExternalToInternal(event, room));
	}

	async sendMessage({ recipient, body }) {
		return this.client.sendEvent(recipient, 'm.room.message', { body, msgtype: 'm.text' }, '', (err) => {
			console.log(err);
		});
	}
};
