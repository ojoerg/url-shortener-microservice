'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var bodyParser = require('body-parser');
var validUrl = require('valid-url');


var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }); 

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});


//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

var Schema = mongoose.Schema;
var schema = new Schema({ "original_url": String, "short_url": Number});
var urlShortener = mongoose.model('urlShortener', schema); 

app.post("/api/shorturl/new", function(req, res) {
  var originalUrl = req.body.url;
  
  function urlValidator() { 
    if (validUrl.isUri(originalUrl)) {
      return true;
    }else{
      res.json({"error": "invalid url"});
    }
  };
  
  if (urlValidator()) {
     urlShortener.findOne({"original_url": originalUrl}, function(err, urlFound) {
       if (err) {
         return console.log(err)
       }

       if (urlFound) {
         res.json({"original_url": originalUrl, "short_url": urlFound.short_url });
       }else {
         var shortUrl = 0;
         async function shortUrlIsUnique(){
           var tempNumber = Math.floor(Math.random() * 1000) + 1
           
           
           await urlShortener.findOne({"short_url": tempNumber}, function(err, numberFound) {
             if (err) {
               res.json({"error": "Could not find in Database"})
             }
             if (numberFound) {
               shortUrlIsUnique();
             } else {
               shortUrl = tempNumber;
             }
           })
           
         }
        
         Promise.all([shortUrlIsUnique()]).then((tempNumber) => {
 
         var newEntry = new urlShortener({original_url: req.body.url, "short_url": shortUrl});
         newEntry.save(function(err, doc){
           if(err) {
             //console.log(err)
             res.json( {"error": "Could not save to Database"} );
           }else {
             res.json({"original_url": newEntry.original_url, "short_url": newEntry.short_url});
           }
         })
      })
       } 
    })
  }
})

app.get("/api/shorturl/:short_url", function(req, res){
  var urlToSearch = req.params.short_url;
  console.log(urlToSearch)
  
  if (/\d/g.test(urlToSearch) === false) {
    res.json({"error": "The Short-URL you entered was wrong"})
  } else {
  
    var searchForUrl = urlShortener.findOne({"short_url": urlToSearch}, function(err, found) {
      if (err) {
        res.json({"error": "Could not find in Database"})
      }
      if (found) {
        res.redirect(found.original_url);
      }
    });
  }
});

