var qMap = function(Quintus) {
"use strict";
Quintus.Map = function(Q){
    Q.placeBuilding=function(obj){
        if(obj.p.size===2){
            var tiles = Q.getSurroundingTiles(obj.p.loc,true);
            //Set each tile to be occupied by this object
            tiles.forEach(function(tile){
                tile.object = obj;
            });
        } else {
            Q.occupied[obj.p.loc[1]][obj.p.loc[0]].object = obj;
        }
        var owner = obj.p.owner;
        owner.buildings.push(obj);
        return obj;
    };
    //Place an object in the occupied array and insert it into the stage
    //Also adds it to the player's objects
    Q.placeClientBuilding=function(obj){
        var ob = Q.placeBuilding(obj);
        ob.add("ownable, hpBar");
        if(Q.checkOwned(obj.p.owner.player)){
            ob.show();
            Q.unFog(Q.getLOS(ob.p.loc,ob.p.los));
        } else if(Q.fog.p.tiles[ob.p.loc[1]][ob.p.loc[0]]===11){
            ob.show();
        }
        Q.connection.socket.emit("placeBuilding",{class:"Market",loc:[9,3]});
        return ob;
    };
    Q.placeUnit=function(obj){
        var owner = obj.p.owner;
        Q.occupied[obj.p.loc[1]][obj.p.loc[0]].object = obj;  
        owner.units.push(obj);
        return obj;
    };
    Q.removeBuilding = function(obj){
        var owner = obj.p.owner;
        if(obj.p.size===2){
            var tiles = Q.getSurroundingTiles(obj.p.loc,true);
            tiles.forEach(function(tile){
                tile.object = null;
            });
        } else {
            Q.occupied[obj.p.loc[1]][obj.p.loc[0]].object = null;
        }
        for(var i=0;i<owner.buildings.length;i++){
            if(owner.buildings[i].p.id===obj.p.id){
                owner.buildings.splice(i,1);
                break;
            }
        }
    };
    Q.removeUnit = function(obj){
        var owner = obj.p.owner;
        Q.occupied[obj.p.loc[1]][obj.p.loc[0]].object = null;
        for(var i=0;i<owner.units.length;i++){
            if(owner.units[i].p.id===obj.p.id){
                owner.units.splice(i,1);
                break;
            }
        }
        
    };
};
};
if(typeof Quintus === 'undefined') {
  module.exports = qMap;
} else {
  qMap(Quintus);
}