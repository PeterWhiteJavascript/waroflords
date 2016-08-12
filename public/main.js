window.addEventListener("load", function() {

var Q = window.Q = Quintus({audioSupported: ['mp3','ogg','wav']}) 
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX, Audio, Menus, Map, Game, Objects, UIObjects")
        .setup({
            development: true,
            width:window.innerWidth,
            height:window.innerHeight,
            maximize:"touch",
            upsampleWidth:  420,
            upsampleHeight: 320,
            downsampleWidth: 1024,
            downsampleHeight: 768,
            scaleToFit:true
        });
//Note, the dimensions are not optimal for Nexus 6P, but they're pretty good for everything else :)
Q.touch(Q.SPRITE_ALL).controls(true)
        .enableSound();

require(['socket.io/socket.io.js']);
Q.inMenu=true;

var socket = io.connect();
//All information about this connection is here
var connection = Q.connection = {};
function setUp(){
    /**CONNECTION**/  
    //When the user connects to the game
    socket.on('connected', function (data) {
        connection.id = data['uniqueId'];
        connection.socket = socket;
        //Tell the server that this client knows that it is connected now.
        socket.emit('confirmConnect',{uniqueId:connection.id});
        //TODO
        //Load the login screen
        //Q.stageScene("mainMenu",0,{connection:connection});
        
        //TESTING: Find a quick match on load
        var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        connection.socket.emit("findQuickMatch",{elo:1101+Math.floor(Math.random()*30),name:"Mr. "+letters[Math.floor(Math.random()*26)]});
    });
    
    //When a user disconnects from the game
    socket.on("disconnected",function(data){
        alert("Opponent disconnected...");
        Q.stageScene("mainMenu",0,{connection:connection});
    });
    /**END CONNECTION**/
    
    //data contains information about the opponent
    socket.on("startQuickMatch",function(data){
        Q.state.set("opponent",data.opponent);
        var op = Q.state.get("opponent");
        op.buildings = [];
        op.units = [];
        Q.state.set("self",data.self);
        var se = Q.state.get("self");
        se.buildings = [];
        se.units = [];
        Q.stageScene("initializeGame",0,{map:data.map});
    });
    
    socket.on("firstTurn",function(data){
        Q.state.set("turn",data.player);
        Q.getOwner(1).lord = Q.assets["lords.json"][data.lords[0]];
        Q.getOwner(2).lord = Q.assets["lords.json"][data.lords[1]];
        Q.clearStage(3);
        Q.stageScene("showVSstats",3);
    });
    //At the start of each turn
    socket.on("startTurn",function(data){
        if(Q.checkOwned(data.player)){
            Q.startTurn();
        } else {
            Q.standByTurn();
        }
    });
}

//Q.debug=true;
setUp();
});

