var fs = require('fs');
var wiki = require('wikijs').default();
var getWords = require('./words');
var getImages = require('./images');
var renderer = require('./renderer');
var { tweet, onMention } = require('./tweet');

var interval = process.argv[ 2 ] ? Number( process.argv[ 2 ] ) : 60;

var randomTitle = async () => await wiki.random( 1 ).then( r => r[ 0 ] );

var search = async title => {
    var { results } = await wiki.search( title );
    var page;
    if ( results.length ) {
        title = results[ 0 ];
        page = await wiki.page( title );
    } else {
        return { status: 'error', message: 'article not found' };
    }
    console.log( `${ title } starter pack...` );
    var words = await getWords( page );
    var images;
    try {
        images = await getImages( wiki, page );
        console.log(`it'll do`);
        return { status: 'ok', title, images, words };
    } catch ( e ) {
         console.log( `it won't do: ${e.message}` );
         return { status: 'error', message: e.message };
    }
}

var random = async () => {
    var r;
    do {
        r = await search( await randomTitle() );
        console.log( r );
    } while ( r.status === 'error' )
    var path = await renderer( r );
    return await tweet( { status: r.title + ' starter pack' }, path );
}

var repeat = async () => {
    await random();
    console.log(`see you in ${ interval }`)
    setTimeout( repeat, 1000 * 60 * interval );
}

var reply = async twt => {
    var title = twt.text.replace('@starterpackbot', '').trim();
    var r = await search( title );
    if ( r.status === 'error' ) {
        return await tweet({ in_reply_to_status_id: twt.id_str, status: '🚨 ' + r.message })
    } else {
        var path = await renderer( r );
        var status = `.${ twt.user.screen_name } ${ r.title } starter pack`;
        return await tweet({ in_reply_to_status_id: twt.id_str, status }, path );
    }
}

// repeat();

// onMention( reply );

(async ()=>{renderer( await search('Thanks') )})()