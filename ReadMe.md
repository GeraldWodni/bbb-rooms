# bbb-rooms

bigbluebutton promise api with simple persistant rooms

## (Pseudo) persistant rooms:

Hint: there are no persistant rooms, once a conference is idle bbb will close it. This API however checks if the room exists, and will create it if it does not. For the user the room will therefor appear persistant.

### joinPersitantRoom( joinOpts, createOpts )
Note: the options are kept separate intentionally. That way this module is much more future proof.

Creates the room (idempotent operation), then join.
Session cookie returned as `res.join.cookie` (needs to be set before using URL!)

```js
const BbbApi = require("bbb-rooms");
const bbbApi = new BbbApi( "bbb.example.com", "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" );
bbb.joinPersitantRoom( {
    meetingID: "euroforth",
    fullName: "Gerald Wodni",
    password: "oneone",
    redirect: false,
}, {
    name: "EuroForth",
    meetingID: "euroforth",
    attendeePW: "oneone",
    moderatorPW: "twotwo",
    freeJoin: true,
})
.then( res => console.log( res.join ) )
.catch( err => console.log( "OH NOES:", err ) );
```

### joinPersitantRoomUrl( joinOpts, createOpts )
Like joinPersitantRoom but used for cases where the session cookie cannot be set i.e. cross domain requests.

Creates the room (idempotent operation), then generates join url.

```js
bbb.joinPersitantRoomUrl( {
    meetingID: "euroforth",
    fullName: "Gerald Wodni",
    password: "oneone",
    redirect: true, // here we do want bbb to redirect the user to the proper session
}, {
    name: "EuroForth",
    meetingID: "euroforth",
    attendeePW: "oneone",
    moderatorPW: "twotwo",
    freeJoin: true,
})
.then( res => console.log( res.join ) )
.catch( err => console.log( "OH NOES:", err ) );
```

## Standard API (promisified)
See [bigbluebutton api documentation](https://docs.bigbluebutton.org/dev/api.html) for the most up-to-date parameters and their usage.

### constructor( hostname, secret )
```js
const BbbApi = require("bbb-rooms");
const bbbApi = new BbbApi( "bbb.example.com", "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" );
```

### create( params )
create a new meeting using GET

```js
bbbApi.create({
    name: "EuroForth",
    meetingID: "euroforth",
    attendeePW: "oneone",
    moderatorPW: "twotwo",
    freeJoin: true, // allow choice of breakout rooms

    allowModsToUnmuteUsers: true,
    logoutURL: "https://euro.theforth.net",
    meetingLayout: "PRESENTATION_FOCUS",
})
.then( res => console.log( "RES:", res ) )
.catch( err => console.log( "OH NOES:", err ) );
```

### createWithSlides( params, slides )
create a new meeting using POST (allows slide upload)

```js
bbbApi.createWithSlides({
    name: "EuroForth",
    meetingID: "euroforth",
    attendeePW: "oneone",
    moderatorPW: "twotwo",
    freeJoin: true, // allow choice of breakout rooms
},[
    { url: "https://example.com/slides.pdf",  filename: "slides.pdf"  },
    { url: "https://example.com/slides2.pdf", filename: "slides2.pdf" },
])
.then( res => console.log( "RES:", res ) )
.catch( err => console.log( "OH NOES:", err ) );
```

### join( params )
join existing meeting

Join as attendee
```js
bbbApi.join({
    meetingID: "euroforth",
    fullName: "Gerald Wodni",
    password: "oneone", // note: use attendeePW from create
    redirect: false, // give us the xml, so we can handle the url
    avatarURL: "https://gravatar.com/avatar/c2a44082e5c02c04212c34d64c5fa9c5/64/retro", // gravatar, you might want to proxy that for privacy reasons
})
.then( res => console.log( "RES:", res ) )
.catch( err => console.log( "OH NOES:", err ) );
```

See [bigbluebutton customization documentation](https://docs.bigbluebutton.org/admin/customize.html#Customize_) for details on how to make bbb not look so bland.

Join as moderator (with customization)
```js
bbbApi.join({
    meetingID: "euroforth",
    fullName: "Chuck Moore",
    password: "twotwo", // note: use moderatorPW from create
    "userdata-bbb_auto_join_audio": true,
    "userdata-bbb_client_title": "EuroForth",
    "userdata-bbb_show_public_chat_on_login": false,
    "userdata-bbb_force_restore_presentation_on_new_events": true,
    "userdata-bbb_custom_style": "body{background-color:#800!important;}",
})
.then( res => console.log( "RES:", res ) )
.catch( err => console.log( "OH NOES:", err ) );
```

### getMeetings()
get a list of meetings

```js
bbbApi.getMeetings()
.then( res => console.log( "RES:", res ) )
.catch( err => console.log( "OH NOES:", err ) );
```

### getMeetingInfo( params )
get detailed meeting info including a list of attendees

```js
bbbApi.getMeetingInfo({
    meetingID: "euroforth",
})
.then( res => console.log( "RES:", res ) )
.catch( err => console.log( "OH NOES:", err ) );
```

### isMeetingRunning( params )
check if meeting is running

```js
bbbApi.isMeetingRunning({
    meetingID: "euroforth",
})
.then( res => console.log( "RES:", res ) )
.catch( err => console.log( "OH NOES:", err ) );
```

### end( params )
forcefully end meeting

```js
bbbApi.end({
    meetingID: "euroforth",
    password: "twotwo", // provide moderator password
})
.then( res => console.log( "RES:", res ) )
.catch( err => console.log( "OH NOES:", err ) );
```
