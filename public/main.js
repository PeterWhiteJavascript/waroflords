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
Q.state.set("inMenu",true);


var socket = io.connect();
//All information about this connection is here
var connection = Q.connection = {};
function player(id,elo,player,name){
    this.id = id;
    this.elo = elo;
    this.player = player;
    this.name = name;
    
    this.officers = [];
    this.troops = [];
    this.buildings = [];
    this.units = [];
    this.equip = {spears:60,pikes:50,swords:40,clubs:100,bows:0,rams:20,catapults:10,horses:300};
};

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
        Q.stageScene("mainMenu",0,{connection:connection});
        
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
        var opponent = new player(data.opponent.id,data.opponent.elo,data.opponent.player,data.opponent.name);
        Q.state.set("opponent",opponent);
        var self = new player(data.self.id,data.self.elo,data.self.player,data.self.name);
        Q.state.set("self",self);
        Q.state.set("gameID",data.gameID);
        Q.state.set("gameType",data.gameType);
        Q.stageScene("initializeGame",0,{map:data.map});
    });
    
    socket.on("firstTurn",function(data){
        Q.state.set("turn",data.player);
        var p1 = Q.getOwner(1);
        Q.getOwner(1).lord = Q.assets["lords.json"][data.lords[0]];
        p1.buildings[0].addOfficer(p1.lord);
        var p2 = Q.getOwner(2);
        Q.getOwner(2).lord = Q.assets["lords.json"][data.lords[1]];
        p2.buildings[0].addOfficer(p2.lord);
        Q.clearStage(3);
        
        //Start temp
        Q.stageScene("hud",4);
        Q.gameTouchControls();
        Q.calculateLOS();
        Q.state.set("inMenu",false);
        if(Q.checkOwned(data.player)){
            Q.startTurn();
        } else {
            Q.standByTurn();
        }
        return;
        //End temp
        Q.stageScene("showVSstats",3);
        Q.stageScene("hud",4);
    });
    //At the start of each turn
    socket.on("startTurn",function(data){
        Q.state.set("turn",data.player);
        if(Q.checkOwned(data.player)){
            Q.startTurn();
        } else {
            Q.standByTurn();
        }
    });
    
    socket.on("placeBuilding",function(data){
        if(!Q.checkOwned(data.owner)){
            Q.placeClientBuilding(Q.stage(0).insert(new Q[data.class]({loc:data.loc,owner:Q.state.get("opponent")})));
        };
    });
}

//Q.debug=true;
setUp();
});

