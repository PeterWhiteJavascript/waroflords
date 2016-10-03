var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
    res.render('/index.html');
});

var Quintus = require("./public/lib/quintus.js");

require("./public/lib/quintus_sprites.js")(Quintus);
require("./public/lib/quintus_scenes.js")(Quintus);
require("./public/lib/quintus_2d.js")(Quintus);
require("./public/game.js")(Quintus,io);
require("./public/map.js")(Quintus);
require("./public/objects.js")(Quintus);

//Stores a list of all user id's that have connected
var GLOBAL_UNIQUE_IDS = [];
//Confirms that this id has not been taken
function confirmId(){
    for(var i=0;i<GLOBAL_UNIQUE_IDS.length;i++){
        if(GLOBAL_UNIQUE_IDS[i]!==true){
            return i;
        }
    }
}
function player(socket,id,elo,range,name){
    this.socket = socket;
    this.id = id;
    this.elo = elo;
    this.range = range;
    this.name = name;
    
    this.officers = [];
    this.troops = [];
    this.buildings = [];
    this.units = [];
    //The initial armaments
    this.equip = {spears:60,pikes:50,swords:40,clubs:100,bows:0,rams:20,catapults:10,horses:300};
};
//Holds all information about every game
var games = [];
//Stores all clients searching for a match
var searchingQuickMatch = [];
io.on('connection', function (socket) {
    //The connection's unique id
    var id;
    //Checks every second to make sure the user gets connected properly
    var loginInterval;
    //Initialize the connection process
    setTimeout(function () {
        //Join the login room
        socket.join('login');
        //Get an empty spot in the GLOBAL_UNIQUE_IDS array if there is one
        var unconfirmedId = confirmId();
        //Set the connection id
        id = unconfirmedId>=0?unconfirmedId:GLOBAL_UNIQUE_IDS.length;
        //Add the unique id to the array
        GLOBAL_UNIQUE_IDS[id]=true;
        //console.log("Connected as: "+uniqueId, GLOBAL_UNIQUE_IDS)
        loginInterval = setInterval(function(){
            //Tell the client that we are connected to the server and send the unique id.
            socket.emit('connected', { uniqueId: id});
        },1000);
    }, 100);
    //This is recieved when the client confirms that it has connected
    socket.on('confirmConnect',function(data){
        //Stop checking the connection
        clearInterval(loginInterval);
    });
    //When a client disconnects, this is run.
    socket.on('disconnect', function () {
        //nullify the user's connection id so that another client can use it.
        GLOBAL_UNIQUE_IDS[id]=null;
        //If the user is searching when they disconnect, remove them from the list
        for(var i=0;i<searchingQuickMatch.length;i++){
            if(searchingQuickMatch[i].id === id){
                searchingQuickMatch.splice(i,1);
                break;
            }
        }
        if(socket.Q===undefined){return;};
        //TO DO: Remove the game if the client was in a game and tell the other client that the other user has dc'ed
        games.splice(socket.Q.gameID,1);
        //console.log("Disconnected as: "+uniqueId, GLOBAL_UNIQUE_IDS)
        //Tell all other clients that this user has disconnected
        io.sockets.in("Game"+socket.Q.gameID).emit('disconnected', {uniqueId:id});
    });
    //This function matches player's with similar skill levels
    socket.on("findQuickMatch",function(data){
        var self = socket.self = new player(socket,id,data.elo,100,data.name);
        function findOpponent(){
            //Check to see if a good opponent exists in the searchingQuickMatch array (Close elo, etc...)
            for(var i=0;i<searchingQuickMatch.length;i++){
                var opponent = searchingQuickMatch[i];
                if(opponent.id===id){continue;};
                //Match if elo is within the lowest range
                var range = (opponent.range<self.range)?opponent.range:self.range;
                //If the elo's are with the lowest range, a match has been found!
                if(Math.abs(opponent.elo-self.elo)<=range){
                    //TO DO: Random map
                    var map = "map.json";
                    var gameID = games.length;
                    //Send both participants a start message along with information about their opponent.
                    //The player who was waiting longer is player 1
                    socket.emit("startQuickMatch",{self:{name:self.name,elo:self.elo,id:self.id,player:2},opponent:{name:opponent.name,elo:opponent.elo,id:opponent.id,player:1},gameID:gameID,gameType:"QuickMatch",map:map});
                    socket.join("Game"+gameID);
                    opponent.socket.emit("startQuickMatch",{self:{name:opponent.name,elo:opponent.elo,id:opponent.id,player:1},opponent:{name:self.name,elo:self.elo,id:self.id,player:2},gameID:gameID,gameType:"QuickMatch",map:map});
                    opponent.socket.join("Game"+gameID);
                    //Remove the matched client
                    searchingQuickMatch.splice(i,1);
                    //Stop the rangeIntervals
                    clearInterval(self.rangeInterval);
                    delete(self.rangeInterval);
                    clearInterval(opponent.rangeInterval);
                    delete(opponent.rangeInterval);
                    //Create the new game and initialize it while the clients are confirming that they are still ready to play
                    opponent.ready = false;
                    self.ready = false;
                    opponent.player = 1;
                    self.player = 2;
                    var Q = socket.Q = new Quintus({dataPath:"./public/data/"}).include("Sprites, Scenes, 2D, Game, Map, Objects");
                    opponent.socket.Q = Q;
                    Q.initialized = false;
                    Q.gameID = games.length;
                    Q.p1 = opponent;
                    Q.p2 = self;
                    Q.map = map;
                    //Get the game loop running
                    Q.gameLoop(Q.stageStepLoop);
                    var jsons = [map,"lords.json"];
                    jsons.forEach(function(js){
                        var data = require(Q.options.dataPath+js);
                        Q.assets[js]=data;
                    });
                    //The instance of Q that is shared between the clients that are in a match
                    Q.stageScene("server_game",0,{mapData:Q.assets[map]});
                    games.push(Q);
                    //Make sure we don't add this client to the searching array
                    return true;
                }
            };
        }
        if(!findOpponent()){
            //If no matches, add this client into the array
            //The range is how far apart the opponent can be in elo
            searchingQuickMatch.push(self);
            //After one minute, expand the search
            self.rangeInterval = setInterval(function(){
               self.range+=50;
               findOpponent();
            },10000);
        };
    });
    
    socket.on("confirmedStartQuickMatch",function(data){
        socket.self.lord = socket.Q.assets["lords.json"][data.lord];
        socket.self.ready = true;
        socket.Q.checkInitializedAndReady();
    });
    
    
    
    socket.on("placeBuilding",function(data){
        var Q = socket.Q;
        Q.placeBuilding(Q.stage(0).insert(new Q[data.class]({loc:data.loc,owner:Q["p"+socket.self.player]})));
        socket.broadcast.to("Game"+Q.gameID).emit("placeBuilding",{loc:data.loc,class:data.class,owner:socket.self.player});
    });
});

server.listen(process.env.PORT || 5000);
console.log("Multiplayer app listening on port 5000");
