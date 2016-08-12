var qObjects = function(Quintus) {
"use strict";
Quintus.Objects = function(Q){
    Q.convertLoc = function(loc){
        var xMod = 0;
        if(loc[1]%2===0){xMod = Q.tileH/2;};
        var x = loc[0]*Q.tileH+Q.tileH/2+xMod;
        var y = loc[1]*Q.tileH+Q.tileH/2;
        return [x,y]; 
    };
    Q.convertXY = function(x,y){
        var x = x/Q.tileH;
        var y = Math.floor(y/Q.tileH);
        if(y%2===0){x-=0.5;};
        return [Math.floor(x),y];
    };
    //Returns an array of the six surrounding tiles (with the option of returning the middle tile)
    Q.getSurroundingTiles = function(loc,mid){
        var o = Q.occupied;
        //If we're on an even square
        var tiles;
        if(loc[1]%2===0){
            tiles = [
                o[loc[1]-1][loc[0]],
                o[loc[1]-1][loc[0]+1],
                o[loc[1]][loc[0]-1],
                o[loc[1]][loc[0]+1],
                o[loc[1]+1][loc[0]],
                o[loc[1]+1][loc[0]+1]
            ];
        } else {
            tiles = [
                o[loc[1]-1][loc[0]-1],
                o[loc[1]-1][loc[0]],
                o[loc[1]][loc[0]-1],
                o[loc[1]][loc[0]+1],
                o[loc[1]+1][loc[0]-1],
                o[loc[1]+1][loc[0]]
            ];
        }
        if(mid){tiles.splice(3,0,o[loc[1]][loc[0]]);};
        return tiles;
    };
    //Generates a certain number of troops
    //When recruiting, concat this array
    //The provided id number should be the total force troops.length (TO DO)
    Q.generateTroops=function(num,id){
        var troops = [];
        for(var i=0;i<num;i++){
            troops.push({
                id:id+i,
                atk:1,
                def:1,
                spd:1,
                bld:1,
                eff:1,
                prd:1
            });
        }
        return troops;
    };
    
    //Allows for setting the xy coordinates from a tile location
    Q.component('location',{
        added:function(){
            var pos = Q.convertLoc(this.entity.p.loc);
            this.entity.p.x = pos[0];
            this.entity.p.y = pos[1];
            this.entity.p.z = this.entity.p.y;
        }
    });
    //Client only
    Q.component('ownable',{
        added:function(){
            //Check if this object should be shown (based on ownership)
            this.checkOwned();
        },
        checkOwned:function(){
            var entity  = this.entity;
            if(Q.checkOwned(entity.p.owner.player)){
                entity.show();
            }
        }
    });
    Q.component('troopBar',{
        added:function(){
            var t = this;
            setTimeout(function(){
                t.createTroopBar();
            });
        },
        createTroopBar:function(){
            var entity = this.entity;
            var cont = entity.stage.insert(new Q.TroopBar({obj:entity}));
            entity.on("changeVisibility",cont,"changeVisibility");
            var bar = cont.insert(new Q.TroopFillBar({obj:cont})); 
            entity.on("changeTroops",bar,"displayTroops");
            var text = cont.insert(new Q.TroopText({obj:cont}));
            entity.on("changeTroops",text,"displayTroops");
            entity.trigger("changeTroops");
        }
    });
    Q.component('hpBar',{
       added:function(){
            var t = this;
            setTimeout(function(){
                t.createHpBar();
            });
        },
        createHpBar:function(){
            var entity = this.entity;
            var cont = entity.stage.insert(new Q.HpBar({obj:entity}));
            entity.on("changeVisibility",cont,"changeVisibility");
            var bar = cont.insert(new Q.HpFillBar({obj:cont})); 
            entity.on("changeHp",bar,"displayHp");
            var text = cont.insert(new Q.HpText({obj:cont}));
            entity.on("changeHp",text,"displayHp");
            entity.trigger("changeHp");
        }
    });
    
    Q.Sprite.extend('Town',{
        init:function(p){
            this._super(p,{
                asset:"town.png",
                type:Q.SPRITE_NONE,
                size:2,
                hp:1000,
                maxHp:1000,
                startingTroops:100,
                maxTroops:2000,
                troops:[],
                officers:[],
                los:3
            });
            this.getLord();
            this.add("location");
            this.on("selected");
            this.addTroops(Q.generateTroops(this.p.startingTroops,this.p.troops.length));
            //var troops = this.removeTroops([4,5,6,7,3]); //Remove troops sample
        },
        loseHp:function(loss){
            this.p.hp-=loss;
            if(this.p.hp<=0){alert("You lost");};
            this.trigger("changeHp");
        },
        gainHp:function(gain){
            this.p.hp+=gain;
            if(this.p.hp>this.p.maxHp){this.p.hp=this.p.maxHp;};
            this.trigger("changeHp");
        },
        //Adds the lord to officers at the start of the game
        getLord:function(){
            
        },
        //Increase the number of troops here (by recruit or moving from field)
        addTroops:function(troops){
            this.p.troops = this.p.troops.concat(troops);
            this.trigger("changeTroops");
        },
        //Accepts an array of troop id numbers
        removeTroops:function(troops){
            //Keep track of which troops are removed for returning
            var removed = [];
            //Mark the troops for removal
            for(var i=0;i<troops.length;i++){
                this.p.troops[troops[i]].toRemove=true;
                removed.push(this.p.troops[troops[i]]);
            }
            for(var i=0;i<this.p.troops.length;i++){
                if(this.p.troops[i].toRemove){
                    delete(this.p.troops[i].toRemove);
                    this.p.troops.splice(i,1);
                    i--;
                }
            }
            this.trigger("changeTroops");
            return removed;
        },
        selected:function(){
            if(!this.p.selected){
                this.p.selected = true;
                //Load the menu options
                if(this.p.owner.player===Q.state.get("self").player&&Q.state.get("self").turn){
                    //Load the functional menu on the left
                    Q.stageScene("townMenu",1,{obj:this});
                    //Show stats on the right 
                    Q.stageScene("objectStats",2,{obj:this});
                } else {
                    //Only show a few stats if it's the opponent's town
                    Q.stageScene("objectStats",2,{obj:this});
                }
            } else {
                this.p.selected=false;
                Q.clearStage(1);
                Q.clearStage(2);
            }
        }
    });
    Q.Sprite.extend('Market',{
        init:function(p){
            this._super(p,{
                asset:"market.png",
                type:Q.SPRITE_NONE,
                size:1,
                hp:300,
                los:2
            });
            this.add("location");
            this.on("selected");
        },
        selected:function(){
            if(!this.p.selected){
                this.p.selected = true;
                Q.stageScene("objectStats",2,{obj:this});
            } else {
                this.p.selected=false;
                Q.clearStage(1);
                Q.clearStage(2);
            }
        }
    });
    Q.Sprite.extend('Farm',{
        init:function(p){
            this._super(p,{
                asset:"farm.png",
                type:Q.SPRITE_NONE,
                size:1,
                hp:300,
                los:2
            });
            this.add("location");
            this.on("selected");
        },
        selected:function(){
            if(!this.p.selected){
                this.p.selected = true;
                Q.stageScene("objectStats",2,{obj:this});
            } else {
                this.p.selected=false;
                Q.clearStage(1);
                Q.clearStage(2);
            }
        }
    });
};
};
if(typeof Quintus === 'undefined') {
  module.exports = qObjects;
} else {
  qObjects(Quintus);
}