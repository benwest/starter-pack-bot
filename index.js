var fs = require('fs');
var wiki = require('wikijs').default();
var getWords = require('./words');
var getImages = require('./images');
var renderer = require('./renderer');
var tweet = require('./tweet');

var randomTitle = async () => await wiki.random( 1 ).then( r => r[ 0 ] );

var search = async title => {
    var title = title || await randomTitle();
    var page = await wiki.page( title );
    console.log( `${ title } starter pack...` );
    var words = await getWords( page );//( await page.links() ).filter( oneWord );
    var images;
    try {
        images = await getImages( wiki, page );
        console.log(`it'll do`);
        return { title, images, words };
    } catch ( e ) {
         console.log( `it won't do: ${e.message}` );
         return await search();
    }
}

var go = async () => {
    var r = await search();
    var path = await renderer( r );
    setTimeout( async () => {
        await tweet( r.title + ' starter pack', path )
        console.log('sleeping')
        setTimeout( go, 1000 * 60 * 30 );
    }, 500 );
}

go();