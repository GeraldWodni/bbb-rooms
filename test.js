const BbbApi = require("./index.js");

/* pass data via environment to avoid any passwords in files */
const hostname = process.env.BBB_HOSTNAME;
const secret = process.env.BBB_SECRET;

/* show current meetings */
const bbbApi = new BbbApi( hostname, secret );

async function main() {
    await bbbApi.getMeetings()
    .then( res => console.log( "Current Meetings:", res.meetings ) )
    .catch( err => console.log( "ERROR:", err ) );

    /* create euroforth meeting */
    await bbbApi.create({
        name: "EuroForth",
        meetingID: "euroforth",
        attendeePW: "oneone",
        moderatorPW: "twotwo",
        freeJoin: true, // allow choice of breakout rooms

        allowModsToUnmuteUsers: true,
        meetingLayout: "PRESENTATION_FOCUS",
    })
    .then( res => console.log( "CREATE euroforth messageKey:", res.xml.messageKey ) )
    .catch( err => console.log( "OH NOES:", err ) );

    /* join non-existing room */
    await bbbApi.join({
        meetingID: "red-room",
        fullName: "Gerald Wodni",
        password: "oneone", // note: use attendeePW from create
        redirect: false, // give us the xml, so we can handle the url
        avatarURL: "https://gravatar.com/avatar/c2a44082e5c02c04212c34d64c5fa9c5/64/retro",
    })
    .then( res => console.log( "JOIN RES:", res ) )
    .catch( err => console.log( "OH NOES:", err ) );

    /* create and end red-room */
    await bbbApi.create({
        name: "Red Room",
        meetingID: "red-room",
        attendeePW: "oneone",
        moderatorPW: "twotwo",
    })
    .then( res => console.log( "CREATE red-room RES:", res.xml.returncode ) )
    .then( () => bbbApi.end({
        meetingID: "red-room",
        password: "twotwo",
    }) )
    .then( res => console.log( "END red-room RES:", res.xml.returncode ) )
    .catch( err => console.log( "OH NOES:", err ) );

    /* all in one joinPersitantRoom */
    /* join non-existing room */
    await bbbApi.joinPersitantRoom({
        meetingID: "club",
        fullName: "Gerald Wodni",
        password: "oneone", // note: use attendeePW from create
        redirect: false, // give us the xml, so we can handle the url
        avatarURL: "https://gravatar.com/avatar/c2a44082e5c02c04212c34d64c5fa9c5/64/retro",
    }, {
        name: "Club",
        meetingID: "club",
        attendeePW: "oneone",
        moderatorPW: "twotwo",
    })
    .then( res => console.log( "JOINPERSISTANTROOM RES:", res.join ) )
    .catch( err => console.log( "OH NOES:", err ) );
}

main();
