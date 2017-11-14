var sizeOf = require('./lib/sizeOf');
var shuffle = require('lodash/shuffle');

var validateImage = async url => {
    if ( url.includes('.svg') ) return false;
    var { width, height } = await sizeOf( url );
    return width > 250 && height > 250 && width < 5000;
}

var collectImages = async ( urls, max ) => {
    var images = [];
    for ( var url of urls ) {
        if ( await validateImage( url ) ) {
            console.log('image good 💥');
            images.push( url );
        } else {
            console.log('image no good');
        }
        if ( images.length === max ) return images;
    }
    return images;
}

module.exports = async ( wiki, page ) => {
    var urls = await page.images();
    var mainImages = await collectImages( urls, 4 );
    if ( mainImages.length === 0 ) throw new Error('no image');
    console.log( mainImages.length + '/8' );
    var links = shuffle( await page.links() );
    var relatedImages = [];
    for ( var link of links ) {
        console.log( 'checking ' + link )
        try {
            var page = await wiki.page( link );
        } catch ( e ) {
            console.log('not found');
            continue;
        }
        var _urls = ( await page.images() ).filter( image => {
            return !mainImages.includes( image ) && !relatedImages.includes( image )
            
        });
        if ( _urls.length === 0 ) continue;
        var image = await collectImages( _urls, 1 );
        relatedImages = relatedImages.concat( image );
        console.log( ( mainImages.length + relatedImages.length ) + '/8' )
        if ( mainImages.length + relatedImages.length === 8 ) break;
    }
    if ( mainImages.length + relatedImages.length < 3 ) throw new Error('not enough images')
    return { main: mainImages, related: relatedImages };
}