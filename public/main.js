window.addEventListener("load", function() {

var Q = window.Q = Quintus({audioSupported: ['mp3','ogg','wav']}) 
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX, Audio, Animations, Player, QFunctions, Music, Objects, UI_Objects")
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
Q.uiOpts = {
    
};
Q.touch(Q.SPRITE_ALL).controls(true)
        .enableSound();

Q.getOrientation = function(){
    //If the width is greater than the height, orientation is true
    return Q.width>Q.height?true:false;
};
Q.orientation=Q.getOrientation();
//Holds any actors that need to be added if they joined when there's no Q.stage(1)
Q.state.set("actorsToAdd",[]);

require(['socket.io/socket.io.js']);

var socket = io.connect();

var userId = 0;//Math.floor(Math.random()*2);
var uniqueId;
function setUp(){
    
    /**CONNECTION**/  
    //When the user connects to the game
    socket.on('connected', function (data) {
        uniqueId = data['uniqueId'];
        //Tell the server that this client has connected properly
        //This will be sent after login ince that is done. It will take the user to the lobby
        //The flow will be:
        //User enters username/password -> get filename and userId id for this user from database 
        //LOOK IN TO USING LevelUP DATABASE
        socket.emit('confirmConnect',{file:"2d3axd",userId:userId,uniqueId:uniqueId});
    });
    
    //When a user disconnects from the game
    socket.on("disconnected",function(data){
        if(Q.stage(1)){
            //data contains the user that disconnected's id
            var actor = Q("Actor",1).items.filter(function(act){
                return act.p.uniqueId===data.uniqueId;
            })[0];
            if(actor){
                actor.destroy();
            } else {console.log("Actor not found...");};
        }
    });
    
    socket.on("joinedGame",function(data){
        var loc = Q.getLoc({p:data});
        data.loc = loc;
        var actor = new Q.Actor(data);
        actor.p.x = data.x;
        actor.p.y = data.y;
        actor.p.z = actor.p.y+2;
        //Add an actor for this new player
        if(Q.stage(1)){
            Q.stage(1).insert(actor);
        } else {
            var acts = Q.state.get("actorsToAdd");
            acts.push(actor);
        }
    });
    /**END CONNECTION**/
    
    /**INITIAL MENUS**/
    socket.on("startGame",function(data){
        var player = data['activeUsers'][data['activeUsers'].length-1];
        console.log("I am "+player['username']+". ID: "+player['uniqueId']);
        setInitialState(data);
    });
    /**END INITIAL MENUS**/
    
    /**DURING GAMEPLAY**/
    Q.sendData=function(name,data){
        data['map']=Q.state.get("currentLevel")['map'];
        socket.emit(name,data);
    };
    
    socket.on("startScene",function(data){
        setInitialState(data);
    });
    
    socket.on("PlayerEvent",function(data){
        var player = Q("Actor",1).items.filter(function(p){
            return p.p.uniqueId===data['uniqueId'];
        })[0];
        /*if(data['uniqueId']===uniqueId){
            player = Q.state.get("playerObj");
        } else {
            player = Q("Actor",1).items.filter(function(p){
                return p.p.uniqueId===data['uniqueId'];
            })[0];
        }*/
        data['funcs'].forEach(function(func,i){
            player[func](data['props'][i]);
        });
    });
    socket.on("QEvent",function(data){
        data['funcs'].forEach(function(func,i){
            Q[func](data['props'][i]);
        });
    });
    socket.on("timeTick",function(data){
        //On the start of every hour
        if(Q.state.get("time")[0]!==data[0]){
            Q.state.trigger("newHour");
        }
        Q.state.set("time",data);
        //New day
        if(data[0]===0&&data[1]===0){
            var date = Q.state.get("date");
            Q.state.set("date",{year:date.year,month:date.month,day:date.day+1});
        }
        Q.state.trigger("timeTick");
    });
    socket.on("changeProp",function(data){
        var user = Q.state.get("playerObj");
        user.p[data['prop']]=data['value'];
        user.trigger("change_"+data['prop']);
    });
    socket.on("BagEvent",function(data){
        var player = Q("Actor",1).items.filter(function(p){
            return p.p.uniqueId===data['uniqueId'];
        })[0];
        if(data['func']){
            player.Bag[data['func']](data['props'][i]);
        } else {
            data['funcs'].forEach(function(func,i){
                player.Bag[func](data['props'][i]);
            });
        }
    });
    /**END DURING GAMEPLAY**/
}
function setInitialState(data){
    Q.state.set(data);
    Q.state.set("player",data['activeUsers'].filter(function(p){return p.uniqueId===uniqueId;})[0]);
    Q.startScene(data['currentLevel']);
};

var imageFiles = [
    "player_1.png",
    "buildings.png",
    "ui_objects.png",
    "solid_interactables.png",
    
    "treasures.png",
    "crops.png",
    "food.png",
    "materials.png",
    "fish.png",
    "meat.png",
    "ores.png",
    "bugs.png",
    "equipment.png",
    "other.png",
    
    "carrot.png",
    "beet.png",
    "potato.png",
    "lettuce.png"
];
for(i=0;i<imageFiles.length;i++){
    imageFiles[i]="/images/"+imageFiles[i];
}

var jsonFiles = [
    "buildings.json",
    "items.json",
    "solid_interactables.json",
    
    "crops.json",
    "ui_objects.json"
];
for(i=0;i<jsonFiles.length;i++){
    jsonFiles[i]="/data/json/"+jsonFiles[i];
}
Q.load(imageFiles.concat(jsonFiles).concat(["/lib/pathfinding-browser.min.js"]).join(','),function(){
    Q.setUpAnimations();
    setUp();
    var jsons = [
        '/data/json/buildings.json',
        '/data/json/crops.json',
        '/data/json/items.json',
        '/data/json/pickups.json',
        '/data/json/solid_interactables.json'
    ];
    var names = [
        "Jbuildings",
        "Jcrops",
        "Jitems",
        "Jpickups",
        "JsolidInteractables"
    ];
    jsons.forEach(function(json,i){
        Q.state.set(names[i],Q.assets[json]); 
    });
});

Q.startScene=function(data){
    var sceneMap = data.map;
    var music = data.music;
    //Load the tmx map
    Q.loadTMX("areas/"+sceneMap+".tmx",function(){
        //Load the music
        Q.playMusic(music+".mp3",function(){ 
            //Add the objects to the map
            Q.makeScene(sceneMap,function(stage){
                var ground = stage.groundLayer;
                //var collision = stage.collisionLayer;
                var level = Q.state.get("currentLevel");
                var bKeys = Object.keys(Q.state.get("Jbuildings"));
                var iKeys = Object.keys(Q.state.get("Jitems"));
                var cKeys = Object.keys(Q.state.get("Jcrops"));
                var sKeys = Object.keys(Q.state.get("JsolidInteractables"));
                level.buildings.forEach(function(building,i){
                    stage.insert(new Q.Building({itemId:building.itemId,loc:building.loc,sheet:bKeys[building.itemId],uniqueId:i}));
                });
                level.pickups.forEach(function(pickup,i){
                    stage.insert(new Q.Pickup({groupId:pickup.groupId,itemId:pickup.itemId,loc:pickup.loc,sheet:iKeys[pickup.groupId],frame:pickup.itemId,level:pickup.level,uniqueId:i}));
                });
                level.tilledSoil.forEach(function(soil){
                    if(soil.watered>0){
                        ground.setTile(soil.loc[0],soil.loc[1],Q.wateredSoilNum);
                    } else {
                        ground.setTile(soil.loc[0],soil.loc[1],Q.soilNum);
                    }
                });
                level.crops.forEach(function(crop,i){
                    //It's a crop that is not a seed
                    if(crop.phase>=1){
                        var cr = stage.insert(new Q.Crop({itemId:crop.itemId,loc:crop.loc,sheet:cKeys[crop.itemId],phase:crop.phase,level:crop.level?crop.level:crop.fixedLevel,uniqueId:i}));
                        cr.add("animation");
                        cr.play("phase"+cr.p.phase);
                    }
                    //If it's a seed
                    else if(crop.phase===0){
                        var cr = stage.insert(new Q.Crop({itemId:crop.itemId,loc:crop.loc,sheet:'crops',phase:crop.phase,level:crop.level,uniqueId:i}));
                    }
                });
                level.solidInteractables.forEach(function(int,i){
                    stage.insert(new Q.SolidInteractable({itemId:int.itemId,loc:int.loc,sheet:sKeys[int.itemId],uniqueId:i}));
                });
                //Add any actors
                /*Q.state.get("actorsToAdd").forEach(function(data){
                    var actor = stage.insert(data);
                });*/
                Q.state.get("activeUsers").forEach(function(p){
                    if(uniqueId===p.uniqueId){
                        var player = stage.insert(new Q.Actor(p));//stage.insert(new Q.Player(p));
                        player.p.x = player.p.loc[0]*Q.tileH+player.p.w/2;
                        player.p.y = player.p.loc[1]*Q.tileH+player.p.h/4;
                        player.p.z = player.p.y+2;
                        Q.state.set("playerObj",player);
                    } else {
                        var loc = Q.getLoc({p:p});
                        p.loc = loc;
                        var actor = stage.insert(new Q.Actor(p));
                        actor.p.x = p.x;
                        actor.p.y = p.y;
                        actor.p.z = actor.p.y+2;
                    }
                });
                stage.add("viewport");
                Q.addViewport(stage);
                Q.stageScene("hud",2);

            });
            //Stage the TMX tilemap
            Q.stageScene(sceneMap,1,{sort:true});
        });  
    });
};
Q.makeScene = function(sceneName,callback){
    Q.scene(sceneName,function(stage){
        Q.stageTMX("areas/"+sceneName+".tmx",stage);
        stage.collisionLayer = stage.lists.TileLayer.filter(function(tl){
            return tl.p.collision==="true";
        })[0];
        stage.groundLayer = stage.lists.TileLayer.filter(function(tl){
            return tl.p.ground==="true";
        })[0];
        Q.state.set("mapWidth",stage.collisionLayer.p.cols);
        Q.state.set("mapHeight",stage.collisionLayer.p.rows);
        callback(stage);
    },{sort:true});
};
//The upper heads up display. The contains the UICircles, side menu, time/date, health bar
Q.scene("hud",function(stage){
    //This inserts the HUD and all icons
    var cont = stage.insert(new Q.HUD());
    //Have to call this seperately since cont.stage doesn't exist in init.
    cont.setUpHUD();
});


//Q.debug=true;
});

