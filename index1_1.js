var http = require('http'),
  fs = require('fs');

http.createServer(function(req, res){
  console.log("start");

  fs.readFile('./index.html', function(err, content) {
     if(err){throw err;}
     console.log("response end");
     res.writeHead(200, {'Content - Type' : 'text/html; charset = utf - 8'});
     res.end(content);
  });
  console.log("end");

  }).listen(8192);
  console.log('http://localhost:8192/');

