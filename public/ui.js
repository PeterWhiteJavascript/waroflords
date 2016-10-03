//Client side only
Quintus.UIObjects = function(Q){
    Q.UI.Container.extend("ScrollingBar",{
        init:function(p){
            this._super(p,{
            });
        },
        setUp:function(){
            var p = this.p;
            var under = this.insert(new Q.UnderScrollBar({x:0,y:0,w:p.w,h:p.h}));
            var scrollbarH = under.p.h/10;
            if(scrollbarH<16){scrollbarH=16;};
            var scrollbar = this.insert(new Q.ScrollBar({x:0,y:0,w:p.w,h:scrollbarH,box:this,bar:under}));
            var upArrow = this.insert(new Q.CycleArrow({x:0,y:-p.h/2,w:p.w,h:p.w,pos:'up',box:this,bar:scrollbar}));
            upArrow.p.y+=upArrow.p.h/2-upArrow.p.h;
            var downArrow = this.insert(new Q.CycleArrow({x:0,y:p.h/2,w:p.w,h:p.w,pos:'down',box:this,bar:scrollbar}));
            downArrow.p.y-=downArrow.p.h/2-downArrow.p.h;
            
            
            var bottomScrollBarJumper = this.insert(new Q.ScrollBarJumper({x:0,bar:under,w:p.w,h:1,scrollbar:scrollbar,bottom:true}));
            bottomScrollBarJumper.setH((under.p.h)-(scrollbar.p.y+scrollbar.p.h/2)+(under.p.y-under.p.h/2));
            bottomScrollBarJumper.setY(scrollbar.p.y+scrollbar.p.h/2);
            bottomScrollBarJumper.p.cy = 0;
            
            var topScrollBarJumper = this.insert(new Q.ScrollBarJumper({x:0,bar:under,w:p.w,h:1,scrollbar:scrollbar,bottom:false}));
            topScrollBarJumper.setY(scrollbar.p.y-scrollbar.p.h/2);
            topScrollBarJumper.setH(under.p.h);
            topScrollBarJumper.p.cy = 0;
            scrollbar.p.bottomScrollBarJumper = bottomScrollBarJumper;
        }
    });
    
    //This is the arrow at the top and bottom
    Q.UI.Container.extend('CycleArrow',{
        init:function(p){
            this._super(p,{
                type:Q.SPRITE_UI,
                color:"green",
                w:20,h:20
            });
            this.on("touch",this,"clicked");
        },
        draw: function(ctx) {
            ctx.fillStyle = this.p.color;
            //This part should be taken out and coordinates for the triangle should be passed to moveTo and lineTo
            if(this.p.pos==="down"){
                ctx.rotate(Math.PI);
            }
            ctx.beginPath();
            ctx.moveTo(-this.p.w/2,this.p.h/2);
            ctx.lineTo(0,-this.p.h/2);
            ctx.lineTo(this.p.w/2,this.p.h/2);
            ctx.fill();
        },
        clicked:function(e){
            var bar = this.p.bar;
            if(this.p.pos==='down'){
                bar.move(Math.round(-bar.p.maxScroll/100*2));
            } else {
                bar.move(Math.round(bar.p.maxScroll/100*2));
            }
            bar.touchEnd();
        }
    });
    //This is the 'bar' sprite that the scroll bar sits on
    Q.UI.Container.extend('UnderScrollBar',{
        init:function(p){
            this._super(p,{
                fill:'grey',
                type:Q.SPRITE_NONE,
                radius:0
            });
        }
    });
    
    //This is the invinsible jumper that you can push to cycle the list one full page
    //There is one above and one below the scroll bar
    Q.UI.Container.extend('ScrollBarJumper',{
        init:function(p){
            this._super(p,{
                //fill:'red',
                type:Q.SPRITE_UI
            });
            this.on("touch",this,"clicked");
        },
        setH:function(h){
            this.p.h = h;
            this.p.points=[[-this.p.w/2,0],[this.p.w/2,0],[this.p.w/2,this.p.h],[-this.p.w/2,this.p.h]];
        },
        setY:function(y){
            this.p.y=y;
        },
        clicked:function(e){
            var bar = this.p.scrollbar;
            if(this.p.bottom){
                bar.move(Math.round(-bar.p.maxScroll/100*15));
            } else {
                bar.move(Math.round(bar.p.maxScroll/100*15));
            }
            bar.touchEnd();
        }
    });
    
    //This is the scroll bar that you can drag
    Q.UI.Container.extend('ScrollBar',{
        init:function(p){
            this._super(p,{
                fill:"black",
                w:16,
                type:Q.SPRITE_UI,
                shadow:0
            });
            this.p.points=[[-this.p.w/2,-this.p.h/2],[this.p.w/2,-this.p.h/2],[this.p.w/2,this.p.h/2],[-this.p.w/2,this.p.h/2]];
            this.on("drag");
            this.on("touchEnd");
            this.p.y=-this.p.box.p.h/2+this.p.h/2;
            this.p.startY=-this.p.box.p.h/2+this.p.h/2;
            this.p.origY=-this.p.box.p.h/2+this.p.h/2;
            this.p.minScroll=-this.p.box.p.h/2+this.p.h/2;
            this.p.maxScroll=this.p.box.p.h/2-this.p.h/2;
        },
        checkBounds:function(check){
            var min = this.p.minScroll;
            var max = this.p.maxScroll;
            if(check>=min&&check<=max){
                return check;
            } else if(check<min){
                return min;
            } else if(check>max){
                return max;
            }
        },
        touchEnd:function(e){
            this.p.startY=this.p.y;
            this.p.bottomScrollBarJumper.setH((this.p.bar.p.h)-(this.p.y+this.p.h/2)+(this.p.bar.p.y-this.p.bar.p.h/2));
            this.p.bottomScrollBarJumper.setY(this.p.y+this.p.h/2);
        },
        drag:function(e){
            var dif = e.y+this.p.startY;
            var orig = e.sy;
            var percent = Math.round((this.p.y-this.p.origY)/((this.p.maxScroll-this.p.minScroll)/100));
            var box = this.p.box;
            this.p.y = this.checkBounds(dif-orig);
            box.p.portalCont.trigger("scroll",percent);
        },
        move:function(amount){
            this.p.y = this.checkBounds(this.p.y-amount);
            this.p.startY=this.p.y;
            var box = this.p.box;
            var items = box.p.list;
            var percent = Math.round((this.p.y-this.p.origY)/((this.p.maxScroll-this.p.minScroll)/100));
            box.p.portalCont.trigger("scroll",percent);
        }
    });
    
    //End Scrollbar
    //Andrew Beheeler's work on https://gist.github.com/anonymous/7cabe57ee98fc93b59b1a42a63727edf
    Q.component('portal', {
        defaults: {
            portal: {
                h: void 0,
                w: void 0,
                borderColor: "black",
                borderWidth: 1
            }
        },
        added: function () {
            var container = this.entity;

            container.p.type = Q.SPRITE_NONE;
            container.stage.addGrid(container);

            this.matrix = new Q.Matrix2D(container.matrix);

            var p = this.p = this.defaults.portal;
            Q._defaults(p, {
                h: container.p.h,
                w: container.p.w
            });

            p.cx = p.w / 2;
            p.cy = p.h / 2;

            container.on("predraw", this, "predraw");
            container.on("postdraw", this, "postdraw");
            container.on("scroll",this,"scroll");
        },
        //Pass in an item
        scroll:function(to){
            var mult = 64;
            var container = this.entity;
            container.p.y=23-(container.p.h/100)*to;
        },
        resize: function (p) {
            Q._extend(this.p, p);

            this.p.cx = p.w / 2;
            this.p.cy = p.h / 2;

            this._calcMinMax();
        },
        predraw: function (ctx) {
            var p = this.p, container = this.entity;

            ctx.save();

            this.matrix.setContextTransform(ctx);

            ctx.beginPath();
            ctx.lineWidth = p.borderWidth;
            ctx.strokeStyle = p.borderColor;
            ctx.rect(-p.cx, -p.cy, p.w, p.h);
            ctx.stroke();
            ctx.fill();

            ctx.setTransform(1, 0, 0, 1, 0, 0);

            ctx.clip();
        },
        postdraw: function (ctx) {
            ctx.restore();
        }
      });

      /**
      * Clamps a number. Based on Zevan's idea: http://actionsnippet.com/?p=475
      * params: val, min, max
      * Author: Jakub Korzeniowski
      * Agency: Softhis
      * http://www.softhis.com
      */
      (function () { Math.clamp = function (a, b, c) { return Math.max(b, Math.min(c, a)); } })();
    
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
                w:Q.width,
                h:Q.height-70
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
            var value;
            switch(this.p.value){
                case "max":
                    value = "max";
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
                    value = "min";
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
            var contP = Q.stage(1).cont.p;
            contP.maxTroops = obj.maxTroops;
         
            if(contP.troops.length>contP.maxTroops){
                contP.troops.splice(contP.maxTroops,contP.troops.length);
                Q.stage(1).cont.trigger("alterTroops",contP.troops);
            }
            this.setUp();
        },
        setUp:function(){
            var obj = this.p.obj;
            var titleCont = this.insert(new Q.MenuBox({x:this.p.w/2,y:0,w:this.p.w-20,h:50}));
            titleCont.p.y=titleCont.p.h/2+10;
            titleCont.insert(new Q.MenuText({label:obj.name,y:-titleCont.p.h/4}));
            
            var imCont = this.p.image = this.insert(new Q.MenuBox({x:this.p.w/2,y:titleCont.p.y+titleCont.p.h/2,w:this.p.w-20,h:this.p.h/2-60,cy:0}));
            var im;
            if(obj.asset){ 
                im = imCont.insert(new Q.Sprite({x:0,y:imCont.p.h/2,asset:obj.asset,scale:0.75}));
            } else {
                im = imCont.insert(new Q.Sprite({x:0,y:imCont.p.h/2,sheet:obj.sheet,scale:obj.scale}));
            }
            var t = this;
            im.on("touch",function(){
                Q.stageScene(obj.type+"Select",2,{cont:t,obj:obj,building:obj.building});
            });
            
            this["show"+this.p.obj.type]();
        },
        showOfficer:function(){
            var off = this.p.obj;
            var cont = this.insert(new Q.MenuBox({x:this.p.w/2,y:this.p.h/2,w:this.p.w-20,h:this.p.h/2-10,cy:0}));
            var maxTroops = this.insert(new Q.MenuText({x:this.p.image.p.x,y:this.p.image.p.h+16,label:""+off.maxTroops}));
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
            var contP = Q.stage(1).cont.p;
            var troops = contP.troops;
            troops.forEach(function(trp){Q.changeProp(trp,"selected",true);});
            var troopNumber = this.insert(new Q.MenuText({x:this.p.image.p.x,y:this.p.image.p.h+16,label:""+troops.length}));
            this.on("reCalculateTroops",troopNumber,function(troops){
                var stats = Q.addStats(troops);
                var keys = Object.keys(stats);
                keys.forEach(function(key){
                    t.trigger(key+"Set",stats[key]);
                });
                //Change the text label
                troopNumber.p.label = troops.length+"";
            });
            this.on("changeTroops",troopNumber,function(num){console.log(num)
                var from = contP.troops.length;
                if(num==="max"){ num = contP.fullTroops.length>contP.maxTroops?contP.maxTroops:contP.fullTroops.length;}
                else if(num==="min"){ num = -contP.troops.length;};
                var to = contP.troops.length+num;
                var armsCont = Q.stage(1).cont.p.armamentsCont;
                var maxArms = contP.equip[armsCont.p.arms];
                var affectedTroops,mod;
                //Increasing troops
                if(num>0){
                    if(to>contP.fullTroops.length){
                        to = contP.fullTroops.length;
                    }
                    if(to>contP.maxTroops){
                        to = contP.maxTroops;
                    }
                    if(to>maxArms){
                        to = maxArms;
                    }
                    //Can't increase any further
                    if(from===to){return;};
                    //The new troops added
                    affectedTroops = Q.getNewTroops(contP.fullTroops,num);
                    affectedTroops.forEach(function(trp){Q.changeProp(trp,"selected",true);});
                    contP.troops = contP.troops.concat(affectedTroops);
                    mod = 1;
                    
                }
                //Decreasing Troops
                else {
                    console.log(to,from)
                    if(to<0){to=0;};
                    if(from===to){return;};
                    //The troops that are to be removed
                    affectedTroops = contP.troops.splice(to,from);
                    affectedTroops.forEach(function(trp){Q.changeProp(trp,"selected",false);});
                    mod = -1;
                }
                
                var stats = Q.addStats(affectedTroops);
                var keys = Object.keys(stats);
                keys.forEach(function(key){
                    t.trigger(key+"Change",stats[key]*mod);
                });
                //Change the text label
                troopNumber.p.label = to+"";
                armsCont.p.label = to+"";
            });
            var cont = this.insert(new Q.MenuBox({x:this.p.w/2,y:this.p.h/2,w:this.p.w-20,h:this.p.h/2-10,cy:0}));
            var hexagon = cont.insert(new Q.Shape({x:0,y:cont.p.h/2,size:80,fill:"grey",sides:6}));
            var stats = troopNumber.p.stats = Q.addStats(troops);
            var keys = Object.keys(stats);
            hexagon.p.a.forEach(function(a,i){
                if(i===0){return;};
                var stat = stats[keys[i-1]];
                var statName = hexagon.insert(new Q.MenuText({label:keys[i-1],x:a[0]/1.75,y:a[1]/1.75-6,size:20}));
                var statValue = hexagon.insert(new Q.MenuText({label:stat+"",x:a[0]*1.25,y:a[1]*1.25-6,size:20-(stat+"").length,value:stat}));
                t.on(keys[i-1]+"Change",statValue,function(stat){
                    statValue.p.value+=stat;
                    statValue.p.label = statValue.p.value+"";
                });
                t.on(keys[i-1]+"Set",statValue,function(stat){
                    statValue.p.value=stat;
                    statValue.p.label = statValue.p.value+"";
                });
            });
        },
        showArmaments:function(){
            var t = this;
            var obj = t.p.obj;
            var cont = this.insert(new Q.MenuBox({x:this.p.w/2,y:this.p.h/2,w:this.p.w-20,h:this.p.h/2-10,cy:0}));
            var contP = Q.stage(1).cont.p;
            var spears = obj.bld.p.equip.spears;
            //While setting up, the number of spears can only be less than or equal to the max troops
            if(contP.troops.length<spears){spears = contP.troops.length;};
            var curArms = Q.stage(1).cont.p.armamentsCont = this.insert(new Q.MenuText({x:this.p.image.p.x,y:this.p.image.p.h+16,label:""+spears,arms:"spears"}));
            //TODO: Cont will contain abilities that are available based on the officer
            
            
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
                w:Q.width-120,//84
                h:64,
                type:Q.SPRITE_UI
            });
            this.p.x+=this.p.w/2;
        },
        setUp:function(data,xPos){
            var t = this;
            data.forEach(function(d,i){
                t.insert(new Q.MenuText({label:""+d,x:xPos[i],y:-t.p.h/4,size:20-Math.floor(((d+"").length)/2)}));
            });
            
        },
        setUpHeading:function(data){
            var t = this;
            var sections = t.p.w/data.length;
            var xPos = [];
            data.forEach(function(d,i){
                var cont = t.insert(new Q.MenuBox({x:5+i*((sections-1)/t.p.w)*t.p.w-t.p.w/2,y:0,w:sections-15,h:40,fill:"red",type:Q.SPRITE_UI,order:false}));
                cont.insert(new Q.MenuText({label:d,y:-cont.p.h/4-2}));
                cont.p.x+=5+cont.p.w/2;
                cont.on("touch",cont,function(touch){
                    t.container.sortBy(i,cont.p.order);
                    Q.changeProp(cont.p,"order");
                });
                xPos.push(cont.p.x);
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