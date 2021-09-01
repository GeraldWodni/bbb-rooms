/* bbb controller */
/* (c) copyright 2021 by Gerald Wodni <gerald.wodni@gmail.com> */

"use strict";

const http = require("http");
const https = require("https");
const crypto = require("crypto");

class BbbApi {
    constructor( host, secret, opts = {} ) {
        this.host = host;
        this.secret = secret;
        this.opts = Object.assign( {
            apiPath: '/bigbluebutton/api/',
            scheme: "https",
        }, opts );
    }

    stringifyParams( params ) {
        var string = "";
        var separator = "";
        for( const [key, value] of Object.entries( params ) ) {
            string += `${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            separator = "&";
        }
        return string;
    }

    getCallUrl( call, params = {} ) {
        let queryParams = this.stringifyParams( params );

        /* get "signed" request */
        const hash = crypto.createHash("sha1");
        hash.update( call + queryParams + this.secret );
        const checksum = hash.digest("hex");

        /* append checksum to query parameters */
        if( queryParams != "" )
            queryParams += "&";
        queryParams += `checksum=${checksum}`;

        return `${this.opts.scheme}://${this.host}${this.opts.apiPath}${call}?${queryParams}`;
    }

    get( url ) {
        return new Promise( (fulfill, reject) => {
            const Url = new URL( url );
            const req = (Url.protocol == "https:" ? https : http).request( Url, res => {
                var data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => {
                    fulfill({
                        statusCode: res.statusCode,
                        body: data,
                    });
                });
            })
            req.on("error", reject);
            req.end();
        });
    }

    callUrl( call, params = {} ) {
        const url = this.getCallUrl( call, params );
        return this.get( url );
    }

    post( url, body ) {
        return new Promise( (fulfill, reject) => {
            const urlPath = url.substring( this.opts.scheme.length + ('://').length + this.host.length );
            const opts = {
                hostname: this.host,
                port: this.opts.ports || ( this.opts.scheme == "https" ? 443 : 80 ),
                path: urlPath,
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml',
                    'Content-Length': body.length,
                }
            }
            const req = (this.opts.scheme == "https" ? https : http).request( opts, res => {
                var data = "";
                res.on( "data", chunk => data += chunk );
                res.on( "end", () => {
                    fulfill({
                        statusCode: res.statusCode,
                        body: data,
                    });
                });
            });
            req.on("error", reject );

            req.write( body );
            req.end();
        });
    }

    create( params ) {
        return this.callUrl( "create", params );
    }

    createWithSlides( params, slides ) {
        const url = this.getCallUrl( "create", params );

        var documents = "";
        for( const slide of slides )
            documents+=`<document url="${slide.url}" filename="${slide.filename}"/>`

        const body = `<?xml version="1.0"?>
        <modules>
            <module name="presentation">
                ${documents}
            </module>
        </modules>`;
        this.post( url, body );
    }

    join( params ) {
        return this.callUrl( "join", params );
    }

    getMeetings() {
        return this.callUrl( "getMeetings" );
    }

    getMeetingInfo( params ) {
        return this.callUrl( "getMeetingInfo", params );
    }

    isMeetingRunning( params ) {
        return this.callUrl( "isMeetingRunning", params );
    }

    end( params ) {
        return this.callUrl( "end", params );
    }
}

module.exports = BbbApi;
