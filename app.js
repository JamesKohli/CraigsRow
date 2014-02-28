
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
var redis = require('redis');

var app = express();

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

app.get('/', routes.index);
app.get('/users', user.list);

//check for new postings every 15 minutes
var minutes = 1, the_interval = minutes * 60 * 1000;
setInterval(function() {
  console.log("I am doing my 1 minutes check");
  request('http://newyork.craigslist.org/search/sss?zoomToPosting=&catAbb=sss&query=rowing+machine&minAsk=2&maxAsk=500&sort=rel&excats=', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body) // Print the craigslist results
	$ = cheerio.load(body);
	//search longitude >=74.009 and <= -73.933
	//longitude >= 40.697 longitude <= 40.797
	//for each listing
		//if link doesn't exist in db
			//save on link
			//save date
			//save location
			//socket.emit(posting)
  }
})
}, the_interval);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
