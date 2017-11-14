var uniq = require('lodash/uniq');

var blacklist = ['imdb', 'discogs', 'taxonomy (biology)', 'time zone', 'wikidata', 'oclc', 'daylight saving time']
var notBlacklisted = link => !blacklist.some( x => link.toLowerCase() === x );
var oneWord = str => str.split(' ').length === 1;
var namespaces = [
    'User:',
    'Talk:',
    'User talk:',
    'Wikipedia:',
    'File:',
    'MediaWiki:',
    'Template:',
    'Help:',
    'Category:',
    'Portal:',
    'Book:',
    'Draft:',
    'Education Program:',
    'TimedText:',
    'Module:',
    'UTC+',
    'UTC-'
];
var notNamespaced = link => !namespaces.some( namespace => link.startsWith( namespace ) );

module.exports = async page => {
    var title = page.raw.title;
    var links = await page.links();
    var backlinks = await page.backlinks();
    return uniq( [ ...links, ...backlinks ] )
        .filter( oneWord )
        .filter( notNamespaced )
        .filter( link => !title.toLowerCase().includes( link.toLowerCase() ) )
}