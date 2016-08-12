//Client side only
Quintus.UIObjects = function(Q){
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
    Q.Sprite.extend("Button",{
        init:function(p){
            this._super(p,{
                sheet:"button",
                frame:0,
                selected:false
            });
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
            this.p.frame = 1;
        },
        touchEnd:function(touch){
            if(this.checkInBounds(touch.x,touch.y)){
                this.p.selected = true;
                this.trigger("selected");
                this.p.frame = 2;
            } else {
                this.p.frame = 0;
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
            var image = this.insert(new Q.Sprite({asset:this.p.lord+".png",x:this.p.w/2,y:10+nametag.p.h,cy:0}));
            
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
            var sheets = ["spear","sword","bow","weaponry","horse"]
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
            this.p.h = (Q.tileH/8)*obj.p.size;
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
            Q.checkOwned(obj.p.obj.p.owner.player)?this.p.fill="blue":this.p.fill="red";
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