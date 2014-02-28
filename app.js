
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');

if (process.env.REDISTOGO_URL) {
    // inside if statement
	var rtg   = require("url").parse(process.env.REDISTOGO_URL);
	var redis = require("redis").createClient(rtg.port, rtg.hostname);

	redis.client.auth(rtg.auth.split(":")[1]);
} else {

    var redis = require("redis").createClient();
}
var app = express();

//redis stuff
redis.on("error", function (err) {
        console.log("Error " + err);
    });

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
redis.flushall();

app.get('/', routes.index);
app.get('/users', user.list);

//check for new postings every 15 minutes
var minutes = 15, the_interval = minutes * 60 * 1000;
setInterval(function() {
  console.log("I am doing my 15 minutes check");
  request('http://newyork.craigslist.org/search/sss?zoomToPosting=&catAbb=sss&query=rowing+machine&minAsk=2&maxAsk=500&sort=rel&excats=', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log('Searched listings') // Print the craigslist results
	$ = cheerio.load(body);
	
	//check each listing
	$('p.row').each(function(){
		
		//if it's in the right price range and area		
		if ($(this).attr('data-longitude') >= -74.009 && $(this).attr('data-longitude') <= -73.933
			&& $(this).attr('data-latitude') >= 40.697 && $(this).attr('data-latitude') <= 40.797
			){
			console.log($(this).find('.pl').text());
			var pid = $(this).attr('data-pid');
			var listing = $(this).find('.pl').text();
			var price = $(this).find('.price').first().text();
			var link = 'http://newyork.craigslist.com/' + $(this).find('a').attr('href');
			//check for listing
			redis.get(pid + ':pid', (function(pid, listing, price, link){
			return function(err, replies){
				if (replies === null){
						redis.set(pid + ':pid', pid);
						redis.set(pid + ':listing', listing);
						redis.set(pid + ':price', price);
						redis.set(pid + ':link', link);
						console.log(pid + ' saved!');
				} else {
					console.log('Listing ' + replies + ' already saved')
				}
			}})(pid, listing, price, link));			
		}
	});
  }
})
}, the_interval);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
