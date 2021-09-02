/* bbb controller */
/* (c) copyright 2021 by Gerald Wodni <gerald.wodni@gmail.com> */

"use strict";

const http = require("http");
const https = require("https");
const crypto = require("crypto");
const xmlParser = require("fast-xml-parser");

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
                        headers: res.headers,
                        statusCode: res.statusCode,
                        body: data,
                    });
                });
            })
            req.on("error", reject);
            req.end();
        })
        .then( this.processResponse.bind( this ) );
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
        })
        .then( this.processResponse.bind( this ) );
    }

    processResponse( { headers, statusCode, body } ) {
        /* handle unexpected 302 redirects (returned by failed join, even with redirect=false)
         * see: https://github.com/bigbluebutton/bigbluebutton/issues/9749
         * */
        if( body === "" && statusCode == 302 ) {
            const errors = JSON.parse( decodeURIComponent( headers.location.substring( headers.location.indexOf("[") ) ) );
            const err = new Error( errors[0].message );
            err.messageKey = errors[0].key;
            err.returnCode = 'FAILED';
            throw err;
        }

        const xml = xmlParser.parse( body ).response;

        if( xml.returncode != "SUCCESS" ) {
            const err = new Error( xml.message )
            err.messageKey = xml.messageKey;
            err.returnCode = xml.returncode;
            throw err;
        }


        return {
            headers,
            statusCode,
            body,
            xml,
        }
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
        return this.post( url, body );
    }

    createWithOptionalSlides( params, slides = [] ) {
        if( slides.length == 0 )
            return this.create( params );
        else
            return this.createWithSlides( params, slides );
    }

    join( params ) {
        return this.callUrl( "join", params )
        .then( res => {
            res.join = {
                url: res.xml.url,
                cookie: res.headers['set-cookie'],
            };
            return res;
        });
    }

    getMeetings() {
        return this.callUrl( "getMeetings" )
        /* get proper array when no meetings/attendees are available */
        .then( res => {
            if( res.xml.messageKey == 'noMeetings' )
                res.meetings = [];
            else {
                var meetings = Object.assign( {}, res.xml.meetings );
                if( meetings.meeting instanceof Array )
                    meetings = meetings.meeting;
                else
                    meetings = [ meetings.meeting ]

                for( const meeting of meetings ) {
                    if( meeting.attendees === "" )
                        meeting.attendees = [];
                    else if( meeting.attendees.attendee instanceof Array )
                        meeting.attendees = meeting.attendees.attendee;
                    else
                        meeting.attendees = [ meeting.attendees.attendee ];
                }

                res.meetings = meetings;
            }
            return res;
        });
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

    /* api extensions */
    joinPersitantRoom( joinOpts, createOpts, slides = [] ) {
        return this.createWithOptionalSlides( createOpts, slides )
        .then( () => this.join( joinOpts ) );
    }

    joinPersitantRoomUrl( joinOpts, createOpts, slides = [] ) {
        return this.createWithOptionalSlides( createOpts, slides )
        .then( () => { return {
            join: this.getCallUrl( "join", joinOpts ),
        } });
    }
}

module.exports = BbbApi;
