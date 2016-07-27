var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
    res.render('/index.html');
});
/*
var Quintus = require("./public/lib/quintus.js");

require("./public/lib/quintus_sprites.js")(Quintus);
require("./public/lib/quintus_scenes.js")(Quintus);
require("./public/lib/quintus_2d.js")(Quintus);
require("./server/q_server.js")(Quintus);
require("./public/objects.js")(Quintus);
require("./public/q_functions")(Quintus);
require("./public/player.js")(Quintus,PF);
*/
server.listen(process.env.PORT || 5000);
console.log("Multiplayer app listening on port 5000");
