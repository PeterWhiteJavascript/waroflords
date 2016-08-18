//Client side only
Quintus.UIObjects = function(Q){
    Q.UI.Container.extend("Shape",{
        init:function(p){
            this._super(p,{
                size:100,
                sides:3,
                point:1,
                border:"black",
                fill:"black"
            });
            this.p.w=this.p.size*2;
            this.p.h=this.p.size*2;
            this.p.cx = this.p.w/2;
            this.p.cy = this.p.h/2;
            var p = this.p;
            p.a = [[p.point*p.size * Math.sin(0), -p.point*p.size *  Math.cos(0)]];
            for (var i = 1; i <= p.sides;i += 1) {
                p.a.push([p.point*p.size * Math.sin(i * 2 * Math.PI / p.sides), -p.point*p.size * Math.cos(i * 2 * Math.PI / p.sides)]);
            }
            //Fix the array so point '0' is at the top
            p.a.unshift(p.a.pop());
            
        },
        draw:function(ctx){
            var p = this.p;
            ctx.beginPath();
            ctx.moveTo (p.a[0][0], p.a[0][1]);          

            for (var i = 1; i <= p.sides;i += 1) {
                ctx.lineTo (p.a[i][0],p.a[i][1]);
            }

            ctx.strokeStyle = p.border;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.save(); 
            ctx.fillStyle = p.fill; 
            ctx.fill(); 
            ctx.restore();
        }
    });
    
    Q.Sprite.extend("ViewDragger",{
        init:function(p){
            this._super(p,{
                gravity:0,
                type:Q.SPRITE_UI,
                collisionMask:Q.SPRITE_UI,
                vx:0,vy:0,
                speed:3.5,
                slowdown:18
            });
            this.add("2d");
            Q.state.on("change.inMenu",this,"changeAble");
            this.p.disabled = Q.state.get("inMenu");
        },
        changeAble:function(){
            if(this.p.disabled){
                this.on("touch");
                this.on("drag");
                this.p.disabled = false;
            } else {
                this.off("touch");
                this.off("drag");
                this.p.disabled = true;
            }
        },
        touch:function(touch){
            this.p.vx = 0;
            this.p.vy = 0;
            this.p.touchX = touch.x;
            this.p.touchY = touch.y;
        },
        drag:function(touch){
            this.p.vx += (this.p.touchX-touch.x)*this.p.speed;
            this.p.vy += (this.p.touchY-touch.y)*this.p.speed;
            this.p.touchX = touch.x;
            this.p.touchY = touch.y;
            this.p.dragging = true;
        },
        step:function(){
            if(!this.p.dragging){
                this.p.vx-=this.p.vx/this.p.slowdown;
                this.p.vy-=this.p.vy/this.p.slowdown;
                if(Math.abs(this.p.vx)<=1&&Math.abs(this.p.vy)<=1){this.p.vx=0;this.p.vy=0;};
            }
            this.p.dragging=false;
        }
    });
    //This is the big box that appears when selecting officers/troops/etc...
    Q.UI.Container.extend("ActionBox",{
        init:function(p){
            this._super(p,{
                fill:'white',
                border:"black",
                radius:1,
                opacity:0.8,
                cx:0,cy:0,
                w:Q.width,
                h:Q.height-70,
                x:0,
                y:70
            });
        }
    });
    Q.UI.Container.extend("ValueButton",{
        init:function(p){
            this._super(p,{
                fill:"gold",
                border:"black",
                radius:5,
                type:Q.SPRITE_UI
            });
            this.setTouch();
        },
        setTouch:function(){
            var t = this;
            var curTroops = this.p.ent.p.obj.troops.length;
            var value;
            switch(this.p.value){
                case "max":
                    value = this.p.ent.p.obj.troops.length;
                    break;
                case "more":
                    value = 10;
                    break;
                case "plus":
                    value = 1;
                    break;
                case "minus":
                    value = -1;
                    break;
                case "fewer":
                    value = -10;
                    break;
                case "min":
                    value = 10;
                    break;
            }
            this.on("touch",this.p.ent,function(){
                t.p.ent.trigger("changeTroops",value);
            });
        }
    });
    //The numBar has buttons that increase or decrease a value
    Q.component("numBar",{
        added:function(){
            var entity = this.entity;
            var yellow = entity.insert(new Q.MenuBox({x:entity.p.w,y:0,w:64,h:entity.p.h,fill:"yellow",opacity:1,cx:0,cy:0,border:false}));
            var cont = yellow.insert(new Q.MenuBox({x:yellow.p.w/2-10,y:yellow.p.h/2,w:yellow.p.w,h:yellow.p.h-20}));
            
            var buttons = ["max","more","plus","minus","fewer","min"];
            buttons.forEach(function(button,i){
                var w = cont.p.w-10;
                var start = i-buttons.length/2;
                var mult = w+5;
                var value =  cont.insert(new Q.ValueButton({value:button,x:0,y:start*mult+mult/2,w:w,h:w,ent:entity}));
                value.insert(new Q.Sprite({sheet:"ui_"+button,x:0,y:0,w:32,h:32}));
            });
        }
    });
    //Contains an entire column of ActionBox information (title, clickable image(with callback()), info)
    Q.UI.Container.extend("ColumnInfo",{
        init:function(p){
            this._super(p,{
                fill:"yellow",
                radius:1,
                opacity:1,
                cx:0,cy:0
            });
        },
        changeObj:function(obj){
            this.p.obj = obj;
            for(i=0;i<this.children.length;i++){
                this.stage.remove(this.children[i]);
            }
            this.setUp(obj.name,obj.image,obj.stats);
            this.trigger("changeObj",obj);
        },
        setUp:function(){
            var obj = this.p.obj;
            var titleCont = this.insert(new Q.MenuBox({x:this.p.w/2,y:0,w:this.p.w-20,h:50}));
            titleCont.p.y=titleCont.p.h/2+10;
            titleCont.insert(new Q.MenuText({label:obj.name,y:-titleCont.p.h/4}));
            
            var imCont = this.insert(new Q.MenuBox({x:this.p.w/2,y:titleCont.p.y+titleCont.p.h/2,w:this.p.w-20,h:this.p.h/2-60,cy:0}));
            var im = this.p.image = imCont.insert(new Q.Sprite({asset:obj.image,x:0,y:imCont.p.h/2,scale:0.75}));
            var t = this;
            im.on("touch",function(){
                Q.stageScene(obj.type+"Select",3,{cont:t,obj:obj,building:obj.building});
            });
            
            this["show"+this.p.obj.type]();
        },
        showOfficer:function(){
            var off = this.p.obj;
            var cont = this.insert(new Q.MenuBox({x:this.p.w/2,y:this.p.h/2,w:this.p.w-20,h:this.p.h/2-10,cy:0}));
            
            var pentagon = cont.insert(new Q.Shape({x:0,y:90,size:64,fill:"grey",sides:5}));
            var startAt = -1;
            var stats = off.equip;
            var keys = Object.keys(stats);
            pentagon.p.a.forEach(function(a,i){
                if(i===0){return;};
                var stat = stats[keys[i+startAt]];
                var statName = pentagon.insert(new Q.Sprite({sheet:keys[i+startAt],x:a[0]/1.75,y:a[1]/1.75-6}));
                var statValue = pentagon.insert(new Q.MenuText({label:stat+"",x:a[0]*1.25,y:a[1]*1.25-6,size:14}));
            });
            
            
            var pentagon = cont.insert(new Q.Shape({x:0,y:cont.p.h-80,size:64,fill:"grey",sides:5}));
            var startAt = 5;
            var stats = off.stats;
            var keys = Object.keys(stats);
            pentagon.p.a.forEach(function(a,i){
                if(i===0){return;};
                var stat = stats[keys[i+startAt]];
                var statName = pentagon.insert(new Q.MenuText({label:keys[i+startAt],x:a[0]/1.75,y:a[1]/1.75-6,size:14}));
                var statValue = pentagon.insert(new Q.MenuText({label:stat+"",x:a[0]*1.25,y:a[1]*1.25-6,size:14}));
            });
            
        },
        showTroops:function(){
            var t = this;
            var obj = this.p.obj;
            var troops = Q.getTroops(obj.troops,false,obj.maxTroops,10);
            var troopNumber = this.insert(new Q.MenuText({x:this.p.image.p.x+this.p.image.p.w/2,y:this.p.image.p.y+this.p.image.p.h/2+36,label:""+troops.length,troops:troops}));
            this.on("changeTroops",troopNumber,function(num){
                var from = troopNumber.p.troops.length;
                var to = from+num;
                troopNumber.p.label = to+"";
                var newTroops;
                //Increasing troops
                if(num>0){
                    //The new troops added
                    newTroops = Q.getTroops(troopNumber.p.troops,false,from,to);//troops.slice(from,to);
                    console.log(newTroops)
                    var stats = Q.addStats(newTroops);
                    var keys = Object.keys(stats);
                    console.log(keys)
                    console.log(stats)
                    keys.forEach(function(key){
                        t.trigger(key+"Change",troops[key]+stats[key]);
                    });
                }
                //Decreasing Troops
                else {
                    //The troops that are to be removed
                    var oldTroops = troops.slice(from-to,from);
                    var stats = Q.addStats(oldTroops);
                    var keys = Object.keys(stats);
                    keys.forEach(function(key){
                        t.trigger(key+"Change",troops[key]-stats[key]);
                    });
                }
                troopNumber.p.troops = newTroops;
            });
            var cont = this.insert(new Q.MenuBox({x:this.p.w/2,y:this.p.h/2,w:this.p.w-20,h:this.p.h/2-10,cy:0}));
            var hexagon = cont.insert(new Q.Shape({x:0,y:cont.p.h/2,size:80,fill:"grey",sides:6}));
            var stats = troopNumber.p.stats = Q.addStats(troops);
            var keys = Object.keys(stats);
            hexagon.p.a.forEach(function(a,i){
                if(i===0){return;};
                var stat = stats[keys[i-1]];
                var statName = hexagon.insert(new Q.MenuText({label:keys[i-1],x:a[0]/1.75,y:a[1]/1.75-6,size:20}));
                var statValue = hexagon.insert(new Q.MenuText({label:stat+"",x:a[0]*1.25,y:a[1]*1.25-6,size:20-(stat+"").length}));
                t.on(stat+"Change",statValue,function(stat){console.log(stat)
                    statValue.label = stat+"";
                });
            });
        },
        showArmaments:function(){
            
        },
        showHorses:function(){
            
        }
    });
    
    
    Q.UI.Container.extend("RowInfo",{
        init:function(p){
            this._super(p,{
                fill:'white',
                border:"black",
                radius:1,
                opacity:1,
                x:10,
                w:Q.width-40,
                h:64,
                type:Q.SPRITE_UI
            });
            this.p.x+=this.p.w/2;
        },
        touch:function(touch){
            this.stage.options.cont.changeObj(this.p.obj);
            Q.clearStage(3);
        },
        setUp:function(data,xPos){
            this.on("touch",this,function(touch){
                this.touch(touch);
            });
            var t = this;
            function size(text,to){
                if(text.p.w>to){
                    text.p.size=12;
                }
            };
            data.forEach(function(d,i){
                t.insert(new Q.MenuText({label:""+d,x:xPos[i],y:-t.p.h/4}));
            });
            
        },
        setUpHeading:function(data){
            var t = this;
            var sections = t.p.w/data.length;
            var xPos = [];
            data.forEach(function(d,i){
                var text = t.insert(new Q.MenuText({label:d,x:i*(sections/t.p.w)*t.p.w-t.p.w/2,y:-t.p.h/4}));
                text.p.x+=10+text.p.w/2;
                text.on("touch",function(){
                    t.container.sortBy(i);
                });
                xPos.push(text.p.x);
            });
            return xPos;
        }
    });
    
    Q.UI.Container.extend("MenuBox",{
        init:function(p){
            this._super(p,{
                fill:'white',
                border:"black",
                radius:1,
                opacity:0.3
            });
        }
    });
    Q.UI.Container.extend("InfoBox",{
        init:function(p){
            this._super(p,{
                fill:'white',
                border:"black",
                radius:1,
                cx:0,cy:0,
                opacity:0.3
            });
            //this.p.x+=this.p.w/2;
            //this.p.y+=this.p.h/2;
        }
    });
    Q.UI.Text.extend("MenuText",{
        init:function(p){
            this._super(p,{
                label:"",
                border:"black",
                radius:1,
                align:"center",
                type:Q.SPRITE_NONE
            });
        }
    });
    Q.UI.Text.extend("HUDText",{
        init:function(p){
            this._super(p,{
                label:"",
                border:"black",
                radius:1,
                align:"left",
                type:Q.SPRITE_NONE,
                cx:0,cy:0
            });
        }
    });
    Q.Sprite.extend("Button",{
        init:function(p){
            this._super(p,{
                sheet:"button",
                frame:0,
                selected:false
            });
            this.p.startFrame = this.p.frame;
            this.on("touch");
            this.on("touchEnd");
        },
        checkInBounds:function(x,y){
            if(x<this.c.x-this.p.w/2||x>this.c.x+this.p.w/2||y<this.c.y-this.p.h/2||y>this.c.y+this.p.h/2){
                return false;
            }
            return true;
        },
        touch:function(touch){
            if(!this.p.selected){
                this.p.frame += 1;
            }
        },
        touchEnd:function(touch){
            if(this.checkInBounds(touch.x,touch.y)){
                this.p.selected = true;
                this.trigger("selected");
                this.p.frame += 1;
            } else {
                this.p.frame = this.p.startFrame;
                this.p.selected = false;
            }
        }
    });
    
    Q.UI.Container.extend("LordBanner",{
        init:function(p){
            this._super(p,{
                cx:0,cy:0,
                fill:"red",opacity:0.8
            });
        },
        showStats:function(){
            var data = this.p.data;
            var nametag = this.insert(new Q.MenuText({x:this.p.w/2,y:10,label:data.name}));
            var image = this.insert(new Q.Sprite({asset:data.image,x:this.p.w/2,y:10+nametag.p.h,cy:0}));
            var stats = data.stats;
            var milCont = this.insert(new Q.InfoBox({x:0,y:image.p.y+image.p.h+8,w:this.p.w/2,h:this.p.h/6}));
            var atk = milCont.insert(new Q.MenuText({x:milCont.p.w/2,y:8,label:"ATK: "+stats.atk}));
            var def = milCont.insert(new Q.MenuText({x:milCont.p.w/2,y:milCont.p.h/3+8,label:"DEF: "+stats.def}));
            var spd = milCont.insert(new Q.MenuText({x:milCont.p.w/2,y:milCont.p.h/1.5+8,label:"SPD: "+stats.spd}));
            
            var civCont = this.insert(new Q.InfoBox({x:this.p.w/2,y:image.p.y+image.p.h+8,w:this.p.w/2,h:this.p.h/6}));
            var bld = civCont.insert(new Q.MenuText({x:civCont.p.w/2,y:8,label:"BLD: "+stats.bld}));
            var eff = civCont.insert(new Q.MenuText({x:civCont.p.w/2,y:civCont.p.h/3+8,label:"EFF: "+stats.eff}));
            var prd = civCont.insert(new Q.MenuText({x:civCont.p.w/2,y:civCont.p.h/1.5+8,label:"PRD: "+stats.prd}));
            
            var offCont = this.insert(new Q.InfoBox({x:0,y:civCont.p.y+civCont.p.h+8,w:this.p.w/2,h:this.p.h/4}));
            var chr = offCont.insert(new Q.MenuText({x:offCont.p.w/2,y:8,label:"CHR: "+stats.chr}));
            var int = offCont.insert(new Q.MenuText({x:offCont.p.w/2,y:(offCont.p.h/5)+8,label:"INT: "+stats.int}));
            var ldr = offCont.insert(new Q.MenuText({x:offCont.p.w/2,y:(offCont.p.h/5)*2+8,label:"LDR: "+stats.ldr}));
            var pol = offCont.insert(new Q.MenuText({x:offCont.p.w/2,y:(offCont.p.h/5)*3+8,label:"POL: "+stats.pol}));
            var kno = offCont.insert(new Q.MenuText({x:offCont.p.w/2,y:(offCont.p.h/5)*4+8,label:"KNO: "+stats.kno}));
            
            var equip = data.equip;
            var sheets = ["spear","sword","bow","weaponry","horse"];
            var wpnCont = this.insert(new Q.InfoBox({x:this.p.w/2,y:civCont.p.y+civCont.p.h+8,w:this.p.w/2,h:this.p.h/4}));
            var offset = wpnCont.p.w/3;
            sheets.forEach(function(s,i){
                wpnCont.insert(new Q.Sprite({x:offset,y:20+32*i,sheet:s}));
                wpnCont.insert(new Q.MenuText({x:wpnCont.p.w/2,y:8+32*i,label:" : "}));
                wpnCont.insert(new Q.MenuText({x:wpnCont.p.w-offset,y:8+32*i,label:""+equip[s]}));
            });
        }
    });
    
    
    
    Q.UI.Container.extend("TroopBar",{
        init:function(p){
            this._super(p,{
                fill:'grey',
                border:"black",
                radius:1,
                opacity:0.7,
                hidden:true
            });
            var obj = this.p.obj;
            this.p.troops = obj.p.troops;
            this.p.maxTroops = obj.p.maxTroops;
            this.p.w = Q.tileH*obj.p.size;
            this.p.h = (Q.tileH/8)*obj.p.size;
            this.p.x = obj.p.x;
            this.p.y = obj.p.y-obj.p.h/2-this.p.h*1.5;
            this.p.cx = this.p.w/2;
            this.p.cy = this.p.h/2;
            this.on("changeVisibility");
        },
        changeVisibility:function(to){
            this.p.hidden = to;
        }
    });
    Q.UI.Container.extend("TroopFillBar",{
        init:function(p){
            this._super(p,{
                radius:1,
                opacity:1,
                align:"left",
                x:0,y:0
            });
            var obj = this.p.obj;
            this.p.w = obj.p.w;
            this.p.h = obj.p.h;
            this.p.cx = this.p.w/2;
            this.p.cy = this.p.h/2;
            Q.checkOwned(obj.p.obj.p.owner.player)?this.p.fill="green":this.p.fill="red";
        },
        displayTroops:function(){
            var obj = this.p.obj;
            this.p.w = (obj.p.troops.length/obj.p.maxTroops)*obj.p.w;
        }
    });
    Q.UI.Text.extend("TroopText",{
        init:function(p){
            this._super(p,{
                label:"",
                border:"black",
                align:"center",
                type:Q.SPRITE_NONE,
                x:0,y:0,
                size:14
            });
            var obj = this.p.obj;
            this.p.w = obj.p.w;
            this.p.h = obj.p.h;
            this.p.y=-obj.p.h/2;
        },
        displayTroops:function(){
            var obj = this.p.obj;
            this.p.label = obj.p.troops.length+" / "+obj.p.maxTroops;
        }
    });
    
    Q.UI.Container.extend("HpBar",{
        init:function(p){
            this._super(p,{
                fill:'grey',
                border:"black",
                radius:1,
                opacity:0.7,
                hidden:true
            });
            var obj = this.p.obj;
            this.p.hp = obj.p.hp;
            this.p.maxHp = obj.p.maxHp;
            this.p.w = Q.tileH*obj.p.size;
            this.p.h = (Q.tileH/8)*2;
            this.p.x = obj.p.x;
            this.p.y = obj.p.y-obj.p.h/2-this.p.h/2;
            this.p.cx = this.p.w/2;
            this.p.cy = this.p.h/2;
            this.on("changeVisibility");
        },
        changeVisibility:function(to){
            this.p.hidden = to;
        }
    });
    Q.UI.Container.extend("HpFillBar",{
        init:function(p){
            this._super(p,{
                radius:1,
                opacity:1,
                align:"left",
                x:0,y:0
            });
            var obj = this.p.obj;
            this.p.w = obj.p.w;
            this.p.h = obj.p.h;
            this.p.cx = this.p.w/2;
            this.p.cy = this.p.h/2;
            Q.checkOwned(obj.p.obj.p.owner.player)?this.p.fill="#add8e6":this.p.fill="red";
        },
        displayHp:function(){
            var obj = this.p.obj;
            this.p.w = (obj.p.hp/obj.p.maxHp)*obj.p.w;
        }
    });
    Q.UI.Text.extend("HpText",{
        init:function(p){
            this._super(p,{
                label:"",
                border:"black",
                align:"center",
                type:Q.SPRITE_NONE,
                x:0,y:0,
                size:14
            });
            var obj = this.p.obj;
            this.p.w = obj.p.w;
            this.p.h = obj.p.h;
            this.p.y=-obj.p.h/2;
        },
        displayHp:function(){
            var obj = this.p.obj;
            this.p.label = obj.p.hp+" / "+obj.p.maxHp;
        }
    });
};