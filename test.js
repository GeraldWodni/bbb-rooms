const BbbApi = require("./index.js");

/* pass data via environment to avoid any passwords in files */
const hostname = process.env.BBB_HOSTNAME;
const secret = process.env.BBB_SECRET;

const bbbApi = new BbbApi( hostname, secret );
bbbApi.getMeetings()
.then( console.log.bind( console ) );
