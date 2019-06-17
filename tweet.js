var fs = require('fs');
var Twit = require('twit');

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

var post = options => new Promise( ( resolve, reject ) => twit.post( 'statuses/update', options, ( err, data ) => {
    if ( err ) return reject( err );
    resolve( data );
}));

var tweet = async ( options = {}, imagePath ) => {
    if ( imagePath ) {
        console.log('read', imagePath);
        var data = fs.readFileSync( imagePath, { encoding: 'base64' } );
        console.log('uploading');
        var imageID = await upload( data );
        options = Object.assign({ media_ids: [ imageID ]}, options )
    }
    console.log('tweeting');
    return await post( options );
}

var mentions = twit.stream('statuses/filter', { track: '@starterpackbot'});
mentions.start();

var onMention = fn => {
    console.log('listening...')
    mentions.on( 'tweet', tweet => {
        console.log( tweet.text );
        if (tweet.text.indexOf('@starterpackbot') > -1) {
            console.log( 'a tweet', tweet.text );
            fn( tweet );
        }
    })
}

module.exports = { tweet, onMention };