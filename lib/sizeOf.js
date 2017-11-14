var url = require('url');
var https = require('https');

var sizeOf = require('image-size');

var get = src => new Promise( resolve => https.get( url.parse( src ), response => {
    var chunks = [];
    response
        .on( 'data', chunk => chunks.push( chunk ) )
        .on( 'end', () => {
            resolve( Buffer.concat( chunks ) );
        })
}))

module.exports = async url => {
    var buffer = await get( url );
    try {
        return sizeOf( buffer );
    } catch ( e ) {
        return { width: 0, height: 0, type: 'error' };
    }
}