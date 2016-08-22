var qGame = function(Quintus,io) {
"use strict";
Quintus.Game = function(Q){
    //Set up the normal in game controls (after lord selection)
    Q.gameTouchControls = function(){
        Q.viewport.on("touch");
        Q.viewport.on("drag");
        Q.viewport.on("step");
        
    };
    var playTurnStart=function(){
        var obj;
        var stage = Q.stage(4);
        if(Q.state.get("self").turn){
            obj = stage.insert(new Q.Sprite({cx:0,cy:0,x:3,y:3,sheet:"turn_start",scale:2}));
        } else {
            obj = stage.insert(new Q.Sprite({cx:0,cy:0,x:3,y:3,sheet:"opponents_turn",scale:2}));
        }
        obj.add("tween");
        setTimeout(function(){
            obj.animate({scale:1},1,Q.Easing.Quadratic.InOut);
        },1000);
    };
    Q.startTurn = function(){
        var self = Q.state.get("self");
        self.turn = true;
        playTurnStart();
    };
    
    Q.standByTurn = function(){
        var self = Q.state.get("self");
        self.turn = false;
        playTurnStart();
    };
    Q.hideAll=function(){
        Q.state.get("self").buildings.forEach(function(bld){
            bld.hide();
        });
        Q.state.get("self").units.forEach(function(unt){
            unt.hide();
        });
        Q.state.get("opponent").buildings.forEach(function(bld){
            bld.hide();
        });
        Q.state.get("opponent").units.forEach(function(unt){
            unt.hide();
        });
    };
    //Returns a single object's LOS
    Q.getLOS = function(loc,los){
        var tiles = [];
        //If we're starting on an even line, add one to xOffset
        var yEven = loc[1]%2===0?1:0;
        //Above, below, and center rows
        var rows = los*2+1;
        for(var i=0;i<rows;i++){
            var cols = rows-Math.abs(-los+i);
            var xOffset = Math.floor((Math.abs(i-los)+yEven)/2);
            for (var j=0;j<cols;j++){
                if(i>=0&&i<Q.state.get("mapHeight")&&j>=0&&j<Q.state.get("mapWidth")){
                    tiles.push([loc[0]+j-los+xOffset,loc[1]+i-los]);
                }
            }
        }
        return tiles;
    };
    //Client side only
    Q.calculateLOS = function(){
        var self = Q.state.get("self");
        var bld = self.buildings;
        var unt = self.units;
        var unfog = [];
        bld.forEach(function(b){
            unfog = unfog.concat(Q.getLOS(b.p.loc,b.p.los));
        });
        unt.forEach(function(u){
            unfog = unfog.concat(Q.getLOS(u.p.loc,u.p.los));
        });
        Q.unFog(unfog);
    };
    Q.unFog=function(tiles){
        var fog = Q.fog;
        tiles.forEach(function(f){
            if(f[0]>=0&&f[0]<Q.state.get("mapWidth")&&f[1]>=0&&f[1]<Q.state.get("mapHeight")){
                fog.setTile(f[0],f[1],11);
                if(Q.occupied[f[1]]){
                    var objOn = Q.occupied[f[1]][f[0]].object;
                    if(objOn){
                        objOn.show();
                    }
                }
            }
        });
    };
    Q.checkOwned = function(owner){
        if(owner===Q.state.get("self").player){return true;}
        return false;
    };
    //client side only
    Q.getOwner = function(num){
        return Q.state.get("self").player===num?Q.state.get("self"):Q.state.get("opponent");
    };
    //Server side: Checks if both players are ready and the game has initialized
    Q.checkInitializedAndReady=function(){
        if(Q.initialized&&Q.p1.ready&&Q.p2.ready){
            Q.p1.buildings[0].addOfficer(Q.p1.lord);
            Q.p2.buildings[0].addOfficer(Q.p2.lord);
            //Send the first turn event
            io.sockets.in("Game"+Q.gameID).emit("firstTurn",{player:1,lords:[Q.p1.lord.id,Q.p2.lord.id]});
        }
    };
    //CONSTANTS
    Q.tileH = 64;
    Q.SPRITE_BUILDING = 1;

    //Information about the type of tile in the order of tiles.png
    Q.tileData = [
        {},//White border placeholder
        {name:"grass",cost:1},
        {name:"dirt",cost:1},
        {name:"sand",cost:2},
        {name:"water",cost:1000},
        {name:"mountain",cost:1000}
    ];
    
    //server side game does not load images or create white mesh
    Q.scene("server_game",function(stage){
        //Takes the json data and displays the background image+top mesh
        var data = stage.options.mapData;
        data.layers.forEach(function(layer){
            //The actual tiles that are in the level
            Q.tl = stage.insert(new Q.TileLayer({
                tileW:data.tileW,
                tileH:data.tileH,
                sheet:data.tilesets[layer.tileset],
                tiles:layer.tiles,
                type:Q.SPRITE_NONE
            }));
        });
        //Initialize some variables to keep track of the game
        //This is the same length as the tile layer. It keeps track of where objects are. Only one object can be on a certain tile at a time.
        var occupied = Q.occupied = [];
        for(var i=0;i<Q.tl.p.tiles.length;i++){
            occupied[i]=[];
            for(var j=0;j<Q.tl.p.tiles[0].length;j++){
                //Fill the occupied with empty objects
                occupied[i][j] = {type:Q.tl.p.tiles[i][j],name:Q.tileData[Q.tl.p.tiles[i][j]].name,cost:Q.tileData[Q.tl.p.tiles[i][j]].cost,object:null};
            }
        }
        //Place the towns
        Q.placeBuilding(stage.insert(new Q.Town({loc:data.player1.town,owner:Q.p1})));
        Q.placeBuilding(stage.insert(new Q.Town({loc:data.player2.town,owner:Q.p2})));
        
        Q.initialized = true;
        Q.checkInitializedAndReady();
    });
    //Client create the map with additional white mesh and images
    Q.scene("client_game",function(stage){
        //Takes the json data and displays the background image+top mesh
        var data = stage.options.mapData;
        data.layers.forEach(function(layer){
            //Create a sprite sheet for this tileset
            Q.sheet(data.tilesets[layer.tileset],
            data.tilesets[layer.tileset],
            {
                tilew:data.tileW,
                tileh:data.tileH
            });
            //The actual tiles that are in the level
            Q.tl = stage.insert(new Q.TileLayer({
                tileW:data.tileW,
                tileH:data.tileH,
                sheet:data.tilesets[layer.tileset],
                tiles:layer.tiles,
                type:Q.SPRITE_NONE
            }));
        });
        Q.state.set("mapWidth",Q.tl.p.tiles.length-1);
        Q.state.set("mapHeight",Q.tl.p.tiles[0].length-1);
        //Initialize some variables to keep track of the game
        //This is the same length as the tile layer. It keeps track of where objects are. Only one object can be on a certain tile at a time.
        var occupied = Q.occupied = [];
        //The white mesh that is added to each square
        var whiteTiles = [];
        //The fog of war
        var blackTiles = [];
        for(var i=0;i<Q.tl.p.tiles.length;i++){
            occupied[i]=[];
            whiteTiles[i]=[];
            blackTiles[i]=[];
            for(var j=0;j<Q.tl.p.tiles[0].length;j++){
                blackTiles[i][j]=10;
                //Fill the whiteTiles with 0's (as this is the tile sheet number)
                whiteTiles[i][j]=0;
                //Fill the occupied with empty objects
                occupied[i][j] = {type:Q.tl.p.tiles[i][j],name:Q.tileData[Q.tl.p.tiles[i][j]].name,cost:Q.tileData[Q.tl.p.tiles[i][j]].cost,object:null};
            }
        }
        var white = stage.insert(new Q.TileLayer({
            tileW:data.tileW,
            tileH:data.tileH,
            sheet:data.tilesets[0],
            tiles:whiteTiles,
            type:Q.SPRITE_NONE,
            z:1
        }));
        var black = Q.fog = stage.insert(new Q.TileLayer({
            tileW:data.tileW,
            tileH:data.tileH,
            sheet:data.tilesets[0],
            tiles:blackTiles,
            type:Q.SPRITE_NONE,
            opacity:0.3,
            z:2
        }));
        //When the user clicks, this function handles it
        Q.touchInput.on("touch",white,function(touch){
            if(!Q.state.get("inMenu")){
                var loc = Q.convertXY(touch.p.x,touch.p.y);
                if(!Q.occupied[loc[1]]){console.log("You have clicked off of the map!");return;};
                var tileData = Q.occupied[loc[1]][loc[0]];
                if(!tileData){console.log("You have clicked off of the map!");return;};
                console.log("You have clicked: "+tileData.name+" at: "+loc[0]+","+loc[1]);
                console.log("The cost for moving here is: "+tileData.cost);
                if(tileData.object&&!tileData.object.p.hidden){
                    white.p.objectTouched = tileData.object;
                    console.log("It is occupied by the following object:");
                    console.log(tileData.object);
                } else {
                    white.p.objectTouched = false;
                    console.log("It is not occupied by a visible object.");
                }
            }
        });
        //On touch end, check if the same object that was touched is still touched
        Q.touchInput.on("touchEnd",white,function(touch){
            if(!Q.state.get("inMenu")){
                var loc = Q.convertXY(touch.x,touch.y);
                if(!Q.occupied[loc[1]]){return;};
                var tileData = Q.occupied[loc[1]][loc[0]];
                if(!tileData){return;};
                if(tileData.object&&white.p.objectTouched===tileData.object&&!tileData.object.p.hidden){
                    tileData.object.trigger("selected");
                }
            }
        });
        //Place the towns
        var t1 = Q.placeBuilding(stage.insert(new Q.Town({loc:data.player1.town,owner:Q.getOwner(1)})));
        t1.add("ownable, troopBar, hpBar");
        var t2 = Q.placeBuilding(stage.insert(new Q.Town({loc:data.player2.town,owner:Q.getOwner(2)})));
        t2.add("ownable, troopBar, hpBar");
        //Add the viewport and center it on the player's town
        var myTown = Q.checkOwned(t1.p.owner.player)?t1:t2;
        stage.add("viewport");
        var minX=Q.tileH/2;
        var maxX=Q.state.get("mapWidth")*Q.tileH*stage.viewport.scale-Q.tileH/2;
        var minY=0;
        var maxY=Q.state.get("mapHeight")*Q.tileH*stage.viewport.scale-Q.tileH*2;
        var viewport = Q.viewport = stage.insert(new Q.ViewDragger({x:myTown.p.x,y:myTown.p.y,w:Q.width,h:Q.height}));
        stage.follow(viewport,{x:true,y:true}/*,{minX: minX, maxX: maxX, minY: minY,maxY:maxY}*/);
        //Hide all buildings/troops
        Q.hideAll();
        
        myTown.addOfficer({
            "id":"officer_2",
            "image":"donkey_kong.png",
            "name":"Officer 2",
            "stats":{
                "atk":12,
                "def":52,
                "spd":53,
                "bld":15,
                "eff":2,
                "prd":2,
                "chr":13,
                "int":1,
                "ldr":1,
                "pol":1,
                "kno":1
            },
            "equip":{
                "spear":4,
                "sword":6,
                "bow":1,
                "weaponry":2,
                "horse":3
            },
            "maxTroops":50}
        );
    });
    
    
    
};
};
if(typeof Quintus === 'undefined') {
  module.exports = qGame;
} else {
  qGame(Quintus);
}