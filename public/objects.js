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
                atk:Math.floor(Math.random()*2)+1,
                def:1,
                spd:1,
                bld:1,
                eff:1,
                prd:1
            });
        }
        return troops;
    };
    //Returns troops taht haven't been selected yet
    Q.getNewTroops=function(troops,num){
        var newTroops = [];
        for(var i=0;i<troops.length;i++){
            if(!troops[i].selected){
                newTroops.push(troops[i]);
                if(newTroops.length>=num){break;};
            }
        };
        return newTroops;
    };
    Q.changeProp=function(obj,prop,to){
        if(!to){
            to = !obj[prop]?true:false;
        }
        obj[prop] = to;
        return obj[prop];
    };
    //Adds up all troops stats and returns the sum
    Q.addStats=function(troops){
        var sum = {atk:0,def:0,spd:0,bld:0,eff:0,prd:0};
        if(troops.length===0) return sum;
        //Loop through each troop
        var keys = Object.keys(troops[0]);
        keys.shift();
        troops.forEach(function(troop){
            keys.forEach(function(key){
                sum[key]+=troop[key];
            });
        });
        return sum;
    };
    //Gets a certain number of troops that is sorted by a stat (id or atk,def,spd,bld,eff,prd)
    Q.sortObjs=function(objs,stat,from,to){
        if(!from){from=0;};
        //If we're getting by order of array (id)
        if(!stat) {return objs.slice(from,to);};
        if(stat.indexOf('.')>-1){
            //First
            var stat1 = stat.slice(0,stat.indexOf('.'));
            //Second
            var stat2 = stat.slice(stat.indexOf('.')+1,stat.length);
            return objs.sort(function(a,b){
                return b[stat1][stat2]-a[stat1][stat2];
            }).slice(from,to);
        } else {
            return objs.sort(function(a,b){
                return b[stat]-a[stat];
            }).slice(from,to);
        }
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
            cont.p.hidden = this.entity.p.hidden;
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
                food:1000,
                gold:1000,
                troops:[],
                officers:[],
                usedTroops:[],
                usedOfficers:[],
                los:3,
                isA:"Town",
                hidden:true
            });
            this.add("location");
            this.on("selected");
            this.addTroops(Q.generateTroops(this.p.startingTroops,this.p.troops.length));
            //var troops = this.removeTroops([4,5,6,7,3]); //Remove troops sample
        },
        changeFood:function(amount){
            this.p.food+=amount;
            this.trigger("changeFood");
        },
        changeGold:function(amount){
            this.p.gold+=amount;
            this.trigger("changeGold");
        },
        gainHp:function(gain){
            this.p.hp+=gain;
            if(this.p.hp>this.p.maxHp){this.p.hp=this.p.maxHp;};
            this.trigger("changeHp");
        },
        loseHp:function(loss){
            this.p.hp-=loss;
            if(this.p.hp<=0){alert("You lost");};
            this.trigger("changeHp");
        },
        addOfficer:function(officer){
            //Add to town
            this.p.officers.push(officer);
            //Add to player
            this.p.owner.officers.push(officer);
            this.trigger("changeOfficers");
        },
        removeOfficer:function(officer){
            
        },
        //Increase the number of troops here (by recruit or moving from field)
        addTroops:function(troops){
            this.p.troops = this.p.troops.concat(troops);
            this.p.owner.troops = this.p.owner.troops.concat(troops);
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
                maxHp:300,
                los:2,
                isA:"Market",
                hidden:true
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
                maxHp:300,
                los:2,
                isA:"Farm",
                hidden:true
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
    
    Q.Sprite.extend('Unit',{
        init:function(p){
            this._super(p,{
                asset:"",
                type:Q.SPRITE_NONE,
                size:1,
                los:2,
                isA:"Unit",
                hidden:true
            });
            this.add("location");
            this.on("selected");
        },
        selected:function(){
            if(!this.p.selected){
                this.p.selected = true;
                Q.stageScene("unitMenu",1,{obj:this});
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