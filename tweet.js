var fs = require('fs');
var Twit = require('twit');

console.log(process.env)

var twit = new Twit({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

var upload = data => new Promise( ( resolve, reject ) => twit.post('media/upload', { media_data: data }, ( err, data ) => {
    if ( err ) return reject( err );
    resolve( data.media_id_string );
}))

var post = ( status, imageID ) => new Promise( ( resolve, reject ) => twit.post( 'statuses/update', { media_ids: [ imageID ], status }, ( err, data ) => {
    if ( err ) return reject( err );
    resolve( data );
}));

module.exports = async ( text, imagePath ) => {
    console.log('read', imagePath);
    var data = fs.readFileSync( imagePath, { encoding: 'base64' } );
    console.log('uploading');
    var id = await upload( data );
    console.log('tweeting');
    await post( text, id );
}