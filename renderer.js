var request = require('request');
var fs = require('fs');
var { createCanvas, loadImage, registerFont } = require('canvas')
var sampleSize = require('lodash/sampleSize');

var size = [ 1400, 1000 ];

registerFont( 'Arial.ttf', { family: 'Arial' } );

var tail = arr => arr[ arr.length - 1 ];

var download = url => new Promise( ( resolve, reject ) => {
    request.head( url, ( err, res, body ) => {
        if ( err ) {
            reject( err );
        } else {
            var filename = tail( url.split('/') );
            var path = './tmp/' + filename;
            request( url ).pipe( fs.createWriteStream( path ).on( 'close', () => resolve( path ) ) );
        }
    })
})

var cleanup = path => new Promise( resolve => fs.unlink( path, resolve ) )

var intersects = ( box1, box2 ) => {
    var xyrb = box => [
        box[ 0 ],
        box[ 1 ],
        box[ 0 ] + box[ 2 ],
        box[ 1 ] + box[ 3 ]
    ]
    var [ x1, y1, r1, b1 ] = xyrb( box1 );
    var [ x2, y2, r2, b2 ] = xyrb( box2 );
    return !(
        x2 >= r1 ||
        r2 <= x1 ||
        y2 >= b1 ||
        b2 <= y1
    )
}
var rand = ( min, max ) => min + Math.floor( Math.random() * ( max - min ) );
var fit = ( src, dest ) => {
    var scale = Math.min( dest[ 0 ] / src[ 0 ], dest[ 1 ] / src[ 1 ] );
    return [ src[ 0 ] * scale, src[ 1 ] * scale ];
}
var randomPosition = ( src, dest ) => {
    return [ rand( 0, dest[ 0 ] - src[ 0 ] ), rand( 0, dest[ 1 ] - src[ 1 ] ) ];
}
var randomBox = ( src, dest, minWidth ) => {
    var max = fit( src, dest );
    var w = rand( minWidth, max[ 0 ] );
    var h = Math.floor( ( w / src[ 0 ] ) * src[ 1 ] );
    return [ ...randomPosition( [ w, h ], dest ), w, h ];
}
var findBox = ( src, dest, boxes, minWidth ) => {
    for ( var i = 0; i < 10000; i++ ) {
        var box = randomBox( src, dest, minWidth );
        if ( !boxes.some( box2 => intersects( box, box2 ) ) ) return box;
    }
    return false;
}
var findPosition = ( src, dest, boxes ) => {
    for ( var i = 0; i < 10000; i++ ) {
        var p = randomPosition( src, dest );
        var box = [ ...p, ...src ];
        if ( !boxes.some( box2 => intersects( box, box2 ) ) ) return p;
    }
    return false;
}

var drawImages = async ( ctx, images, size, filled, minWidth ) => {
    for ( var url of images ) {
        var path;
        try {
            console.log( url );
            console.log('\tDownloading');
            path = await download( url );
            console.log('\tDecoding');
            var image = await loadImage( path );
            var box = findBox( [ image.width, image.height ], size, filled, minWidth );
            if ( !box ) {
                console.log('out of room')
                return;
            }
            console.log('\tDrawing');
            ctx.drawImage( image, 0, 0, image.width, image.height, ...box );
            filled.push( box );
        } catch ( e ) {
            console.log( e );
        } finally {
            if ( path ) await cleanup( path )
        }
    }
}

var save = ( canvas, path ) => new Promise( resolve => {
    var out = fs.createWriteStream( path );
    var stream = canvas.pngStream();
    stream.on('data', chunk => out.write( chunk ) );
    stream.on('end', () => resolve( path ) );
})

var meme = async ({ title, images, words }) => {
    
    console.log('rendering')
    
    var canvas = createCanvas( ...size );
    var ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'white';
    ctx.fillRect( 0, 0, ...size );
    console.log('background done')
    
    ctx.fillStyle = 'black';
    ctx.font = '54px Arial';
    ctx.fillText( title + ' starter pack', 50, 100 );
    console.log('title done')
    
    var filled = [[ 0, 0, size[ 0 ], 150 ]];
    
    await drawImages( ctx, images.main, size, filled, 300 );
    await drawImages( ctx, images.related, size, filled, 100 );
    
    ctx.font = '42px Arial';
    
    for ( var word of sampleSize( words, rand( 2, 5 ) ) ) {
        var sz = [ ctx.measureText( word ).width, 45 ];
        var p = findPosition( sz, size, filled );
        if ( p ) {
            console.log( 'writing ' + word );
            filled.push( [...p, ...size ] );
            ctx.fillText( word, p[ 0 ], p[ 1 ] + 24 );
        } else {
            console.log('no space');
        }
    }
    
    var filename = __dirname + '/img/' + title + '.png';
    
    console.log('saving', filename );
    
    return await save( canvas, filename );
    

}

module.exports = meme;