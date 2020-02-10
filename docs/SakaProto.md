# SakaProto™
SakaProto™ (a portmanteau of Sakamoto and Protocol, name courtesy of @selfisekai) is my own protocol used for exchanging text and multimedia messages. SakaProto™ was designed for use in HakaProxy (server) and NanoIM (client). As it's designed to carry messages from different IM platforms, SakaProto™ is designed to be as transparent as it can be to message origin, in a way where client doesn't need to worry about implementing different methods for different networks.

## Endpoints

### /
- Accepted Parameters:
    (none)
- HakaProxy returns:
    `asdf`, to be replaced with server version and/or supported IMs

### /getContacts
- Accepted Parameters:
    - **token** (internal API token, HakaProxy stores it in config/config.json)
    - **type** (backend type, currently HakaProxy supports only `matrix`)
- HakaProxy returns:
    JSON-encoded array of elements with the following keys:
	- id (internal channel ID, not a number!)
	- name (channel name to display in the client)
	- type (which backend should be used to retrieve and send messages)

### /getHistory
- Accepted Parameters:
    - **token**
    - **type**
    - **number** (same as `id` from `/getContacts`)
    - since (to-be-implemented) (timestamp of last client update)
- HakaProxy returns:
    - If number was valid, a JSON-encoded array of elements with the following keys:
	- room (channel name to display in the client)
	- id (internal channel ID, not a number!)
	- sender (username to display)
	- type (message type, currently either `m.text` or `m.image`)
	- body (message text)
	- images (object)
	    - orig (full image URL)
	    - thumb (thumbnail URL)
	    - name (filename, useful for saving the image to a cache)
    - If number was invalid, an empty JSON array
    
### /sendMessage
- Accepted Parameters:
    - **token**
    - **type**
    - **recipient** (same as `number` from `/getContacts` and `id` from `/getHistory`)
    - **msg** (message text)
- HakaProxy returns:
    (nothing)

## Planned endpoints

### /feed
A websocket message feed for easier and faster message distribution. Would return data simiiar to `/getHistory`, but in real time. 

### /getImage
Image proxy for use with Telegram and other services that won't give public direct links to files or images.

## Disclaimer
SakaProto is in a very early stage of development, thus this file might be outdated as quickly as tommorow. I'll make sure to unify names and make things better before any "stable" version gets a release.
