//Client side only
Quintus.Menus = function(Q){
    //Shows the login with username/password screen
    Q.scene("login",function(stage){
        
    });
    //Once the user clicks "login", the server will check if the username/passord was correct and then send the user to the main lobby
    Q.scene("mainMenu",function(stage){
        var connection = stage.options.connection;
        //For now, let's test some things.
        //This button will match two users into a game room together.
        //If there are more than two users, create a new room.
        stage.insert(new Q.UI.Button({
            x:100,
            y:100,
            label:"Quick Match 1000"
        },function(){
            Q.stageScene("waitingForQuickMatch",0);
            connection.socket.emit("findQuickMatch",{elo:1000});
        }));
        stage.insert(new Q.UI.Button({
            x:100,
            y:160,
            label:"Quick Match 1022"
        },function(){
            Q.stageScene("waitingForQuickMatch",0);
            connection.socket.emit("findQuickMatch",{elo:1022});
        }));
        stage.insert(new Q.UI.Button({
            x:100,
            y:220,
            label:"Quick Match 1101"
        },function(){
            Q.stageScene("waitingForQuickMatch",0);
            connection.socket.emit("findQuickMatch",{elo:1101});
        }));
    });
    
    Q.scene("waitingForQuickMatch",function(stage){
        var cont = stage.insert(new Q.UI.Container({
            x:400,
            y:300,
            h:240,
            w:400,
            fill:"black",
            type:Q.SPRITE_UI
        }));
        
        var text = cont.insert(new Q.UI.Text({
            label:"Finding Opponent.",
            time:2,
            color:"orange"
        }));
        
        var timeText = cont.insert(new Q.UI.Text({
            x:0,
            y:50,
            time:0,
            label:"Time: "+0,
            color:"orange"
        }));
        var timer = setInterval(function(){
            timeText.p.time++;
            timeText.p.label="Time: "+timeText.p.time;
        },1000);
        //Clear the interval when the stage is destroyed
        stage.on("destroyed",function(){
            clearInterval(timer);
        });
    });
    
    //This scene shows the loading screen before a game
    Q.scene("initializeGame",function(stage){
        var map = stage.options.map;
        var self = Q.state.get("self");
        var opponent = Q.state.get("opponent");
        var cont = stage.insert(new Q.UI.Container({
            x:300,
            y:200,
            w:400,
            h:240,
            fill:"black"
        }));
        cont.insert(new Q.UI.Text({
            y:-cont.p.h/2+10,
            label:"VS: "+opponent.name,
            time:2,
            color:"orange"
        }));
        cont.insert(new Q.UI.Text({
            y:-cont.p.h/2+30,
            label:"Opponent's ELO: "+opponent.elo,
            time:2,
            color:"orange"
        }));
        var data = [
            "map.json",
            "ui_assets.json",
            "lords.json"
        ];
        var images = [
            "tiles.png",
            "ui_assets.png",
            
            "donkey_kong.png",
            "ma_teng.png",
            "xu_sheng.png",
            
            "troops.png",
            
            "town.png",
            "market.png",
            "farm.png"
        ];
        //Load any map generation and other objects that need to be created
        Q.load(images.concat(data),function(){
            Q.compileSheets("ui_assets.png","ui_assets.json");
            Q.stageScene("client_game",0,{mapData:Q.assets[map]});
            Q.stageScene("lord_select",3);
        });
    });
    
    
    Q.scene("lord_select",function(stage){
        Q.state.set("inMenu",true);
        var xOffset = 10;
        var cont = stage.insert(new Q.InfoBox({x:0,y:0,w:Q.width,h:Q.height,fill:"black"}));
        cont.insert(new Q.MenuText({x:cont.p.w/2,y:10,label:"Select your lord"}));
        var lords = ["ma_teng","xu_sheng","donkey_kong"];        
        var lordObjects = [];
        var lordsDisplaying = 3;
        lords.forEach(function(lord){
            var lordBanner = cont.insert(new Q.LordBanner({w:cont.p.w/lordsDisplaying-lordsDisplaying*10,h:cont.p.h-60,data:Q.assets["lords.json"][lord]}));
            lordBanner.add("tween");
            lordBanner.showStats();
            var button = lordBanner.insert(new Q.Button({x:lordBanner.p.w/2,y:lordBanner.p.h-64,w:128,h:64}));
            lordBanner.insert(new Q.MenuText({x:button.p.x,y:button.p.y-12,w:128,h:64,label:"Select"}));
            button.on("selected",function(){
                lordObjects.forEach(function(obj){obj.hide();button.off("touch");});
                lordBanner.show();
                lordBanner.animate({x:cont.p.w/2-lordBanner.p.w/2},1,Q.Easing.Quadratic.InOut,{callback:function(){Q.connection.socket.emit("confirmedStartQuickMatch",{lord:lord});}});
            });
            lordObjects.push(lordBanner);
        });
        for(var i=0;i<lordsDisplaying;i++){
            lordObjects[i].p.x = xOffset*(lordsDisplaying/2)+(i*cont.p.w)/lordsDisplaying;
            lordObjects[i].p.y = 50;
        }
        //Cheat for testing
        lordObjects[0].animate({x:cont.p.w/2-lordObjects[0].p.w/2},1,Q.Easing.Quadratic.InOut,{callback:function(){Q.connection.socket.emit("confirmedStartQuickMatch",{lord:lords[0]});}});
    });
    Q.scene("showVSstats",function(stage){
        var self = Q.state.get("self");
        var opponent = Q.state.get("opponent");
        var cont = stage.insert(new Q.InfoBox({x:0,y:0,w:Q.width,h:Q.height,fill:"black"}));
        var selfLord = cont.insert(new Q.LordBanner({x:10,y:Q.height/6,w:cont.p.w/3,h:cont.p.h-60,data:self.lord,lord:self.lord.id}));
        selfLord.showStats();
        selfLord.add("tween");
        var opponentLord = cont.insert(new Q.LordBanner({x:cont.p.w-10,y:Q.height/6,w:cont.p.w/3,h:cont.p.h-60,data:opponent.lord,lord:opponent.lord.id}));
        opponentLord.p.x-=opponentLord.p.w;
        opponentLord.showStats();
        opponentLord.add("tween");
        
        var vs = stage.insert(new Q.UI.Container({x:cont.p.w/2,y:cont.p.h/2,w:cont.p.w/4,h:cont.p.h/8,fill:"black"}));
        vs.add("tween");
        var label = vs.insert(new Q.UI.Text({label:"VS",color:"orange",size:50}));
        label.p.y-=label.p.h/2;
        function spin(obj){
            var angle = obj.p.angle+360;
            obj.animate({angle:angle},0.1,{callback:function(){if(angle<1080){spin(obj);} else {disperse();}}});
        };
        function disperse(){
            vs.animate({y:-100},1);
            selfLord.animate({x:-400},1);
            opponentLord.animate({x:cont.p.w+400},1,{callback:function(){finish();}});
        };
        function finish(){
            Q.clearStage(3);
            Q.gameTouchControls();
            //Show owned and within line of sight
            Q.calculateLOS();
            Q.state.set("inMenu",false);
            if(Q.checkOwned(Q.state.get("turn"))){
                Q.startTurn();
            } else {
                Q.standByTurn();
            }
        };
        setTimeout(function(){
            spin(vs);
        },1000);
        
    });
    
    //The display at the top of the screen showing AP (Action Points), Player name/lord
    Q.scene("hud",function(stage){
        var cont = stage.insert(new Q.InfoBox({x:0,y:0,cx:0,cy:0,w:Q.width,h:70}));
        var self = Q.state.get("self");
        setPos = function(pos){
            return pos*Q.tileH+3;
        };
        
        cont.insert(new Q.HUDText({x:setPos(1),y:setPos(0),label:self.name}));
        cont.insert(new Q.HUDText({x:setPos(1),y:setPos(0.5),label:self.lord.name}));
        
        cont.insert(new Q.Sprite({x:setPos(4),y:setPos(0),cx:0,cy:0,sheet:"ui_food"}));
        var food = cont.insert(new Q.HUDText({x:setPos(5),y:setPos(0.25),label:" x "+self.buildings[0].p.food}));
        self.buildings[0].on("changeFood",food,function(){food.p.label=" x "+self.buildings[0].p.food;});
        
        cont.insert(new Q.Sprite({x:setPos(7),y:setPos(0),cx:0,cy:0,sheet:"ui_gold"}));
        var gold = cont.insert(new Q.HUDText({x:setPos(8),y:setPos(0.25),label:" x "+self.buildings[0].p.gold}));
        self.buildings[0].on("changeGold",gold,function(){gold.p.label=" x "+self.buildings[0].p.gold;});
        
        cont.insert(new Q.Sprite({x:setPos(10),y:setPos(0),cx:0,cy:0,sheet:"ui_officers"}));
        var officers = cont.insert(new Q.HUDText({x:setPos(11),y:setPos(0.25),label:" x "+self.buildings[0].p.officers.length}));
        self.buildings[0].on("changeOfficers",officers,function(){officers.p.label=" x "+self.buildings[0].p.officers.length;});
        
        cont.insert(new Q.Sprite({x:setPos(12),y:setPos(0),cx:0,cy:0,sheet:"ui_troops"}));
        var troops = cont.insert(new Q.HUDText({x:setPos(13),y:setPos(0.25),label:" x "+self.buildings[0].p.troops.length}));
        self.buildings[0].on("changeOfficers",troops,function(){troops.p.label=" x "+self.buildings[0].p.troops.length;});
        
        var options = cont.insert(new Q.Sprite({x:cont.p.w-16,y:16,sheet:"ui_gear",w:32,h:32}));
        options.on("touch",function(){Q.stageScene("options",5);});
    });
    Q.scene("options",function(stage){
        console.log("TODO: Load options");
    });
    
    Q.scene("OfficerSelect",function(stage){
        var bld = stage.options.building;
        
        var cont = stage.insert(new Q.ActionBox({fill:"blue"}));
        var maxShowing = Math.floor(cont.p.h/64);
        if(maxShowing>bld.p.officers.length){
            maxShowing = bld.p.officers.length;
        }
        
        var rowsCont = stage.insert(new Q.ActionBox({x:10,y:80}));
        rowsCont.p.w-=20;
        rowsCont.p.h-=20;
        //When a heading is clicked, sort the officers
        //TODO
        rowsCont.sortBy = function(by){
            console.log(by)
        };
        var headings = ["NAME","TR MAX","CHR","INT","LDR","POL","KNO"];
        var heading = rowsCont.insert(new Q.RowInfo());
        heading.p.y+=heading.p.h/2+10;
        var xPos = heading.setUpHeading(headings);
        for(var i=0;i<maxShowing;i++){
            var off = bld.p.officers[i];
            var obj = {name:off.name,image:off.image,stats:off.stats,troops:off.troops,maxTroops:off.maxTroops,equip:off.equip,type:"Officer",id:off.id,building:bld};
            var info = rowsCont.insert(new Q.RowInfo({y:(i+1)*heading.p.h+20,obj:obj}));
            info.p.y+=info.p.h/2;
            var st = off.stats;
            info.setUp([off.name,off.maxTroops,st.chr,st.int,st.ldr,st.pol,st.kno],xPos);
        }
        
        
    });
    Q.scene("TroopsSelect",function(stage){
        
    });
    Q.scene("ArmamentsSelect",function(stage){
        
    });
    Q.scene("HorsesSelect",function(stage){
        
    });
    
    //March from town or fort
    Q.scene("March",function(stage){
        var cols = 4;
        var offset = 10;
        //Insert the big container
        var cont = stage.insert(new Q.ActionBox());
        //Get the first officer out of the building
        var bld = stage.options.building;
        var off = bld.p.officers[0];
        var obj = {name:off.name,image:off.image,stats:off.stats,troops:bld.p.troops,maxTroops:off.maxTroops,equip:off.equip,type:"Officer",id:off.id,building:bld};
        //Officer
        var officer = cont.insert(new Q.ColumnInfo({x:offset,y:offset,w:cont.p.w/cols-offset/cols,h:cont.p.h-offset*2,obj:obj}));
        officer.setUp();
        //Troops
        var trp = cont.insert(new Q.ColumnInfo({x:offset+officer.p.w,y:offset,w:cont.p.w/cols-offset/cols,h:cont.p.h-offset*2,obj:{name:"Troops",type:"Troops",image:"troops.png",troops:bld.p.troops,maxTroops:off.maxTroops,building:bld}}));
        trp.setUp();
        trp.add("numBar");
        officer.on("changeObj",trp,"changeTroops");
        //Armaments
        //var arm = cont.insert(new Q.ColumnInfo({x:cont.p.w-10,y:10,h:cont.p.h-20}));
        console.log(cont)
        
    });
    Q.scene("Promote",function(stage){
        
    });
    Q.scene("Demote",function(stage){
        
    });
    Q.scene("Repair",function(stage){
        
    });
    Q.scene("townMenu",function(stage){
        Q.state.set("inMenu",true);
        var obj = stage.options.obj;
        var cont = stage.insert(new Q.InfoBox({x:10,y:Q.tileH+10,w:200}));
        var opts = ["March","Promote","Demote","Repair"];
        cont.p.h = 20+opts.length*50;
        opts.forEach(function(opt,i){
            var bCont = cont.insert(new Q.UI.Container({x:cont.p.w/2,y:35+i*50,w:180,h:50,fill:"red",border:"black",opacity:0.5,type:Q.SPRITE_UI}));
            bCont.insert(new Q.MenuText({x:0,y:-12.5,label:opt}));
            bCont.on("touch",function(){
                bCont.destroy();
                Q.clearStage(1);
                Q.clearStage(2);
                Q.stageScene(opt,1,{previousScene:"townMenu",building:obj});
            });
        });
    });
    
    //When a unit is to build something
    Q.scene("Construct",function(stage){
        //TO DO: load construction menu
        
        /*
         * the following goes on placement of building (when the user touches where it sohuld be placed)
          var bld = "Market";
        var loc = [9,3];
        //Test for adding a market
        Q.placeClientBuilding(Q.stage(0).insert(new Q.Market({loc:[9,3],owner:Q.state.get("self")})));
         
         */
    });
    
    Q.scene("unitMenu",function(stage){
        var obj = stage.options.obj;
        var cont = stage.insert(new Q.InfoBox({x:10,y:Q.tileH+10,w:200}));
        var opts = ["Construct"];
        cont.p.h = 20+opts.length*50;
        opts.forEach(function(opt,i){
            var bCont = cont.insert(new Q.UI.Container({x:cont.p.w/2,y:35+i*50,w:180,h:50,fill:"red",border:"black",opacity:0.5,type:Q.SPRITE_UI}));
            bCont.insert(new Q.MenuText({x:0,y:-12.5,label:opt}));
            bCont.on("touch",function(){
                Q.stageScene(opt,1,{previousScene:"unitMenu"});
                Q.clearStage(2);
            });
        });
    });
    Q.scene("objectStats",function(stage){
        var obj = stage.options.obj;
        var cont = stage.insert(new Q.InfoBox({x:Q.width-10,y:Q.tileH+10,w:200}));
        cont.p.x-=cont.p.w;
        if(obj.p.isA==="Town"){
            var hpCont = cont.insert(new Q.InfoBox({x:10,y:10,w:180,h:70,cx:0,cy:0}));
            hpCont.insert(new Q.HUDText({x:hpCont.p.w/2,y:32,label:"HP : "+obj.p.hp+" / "+obj.p.maxHp,align:"center",size:16}));
            var opts = ["food","gold","troops","officers"];
            cont.p.h = 20+(opts.length+1)*70;
            opts.forEach(function(opt,i){
                var bCont = cont.insert(new Q.InfoBox({x:10,y:80+i*70,w:180,h:70,cx:0,cy:0}));
                bCont.insert(new Q.Sprite({x:0,y:0,cx:0,cy:0,sheet:"ui_"+opt}));
                var label = obj.p[opt];
                if(Q._isArray(label)){label=label.length;};
                bCont.insert(new Q.HUDText({x:bCont.p.w-10,y:32,label:" x "+label,align:"right"}));
            });
        } else if(obj.p.isA==="Market"){
            var hpCont = cont.insert(new Q.InfoBox({x:10,y:10,w:180,h:70,cx:0,cy:0}));
            hpCont.insert(new Q.HUDText({x:hpCont.p.w/2,y:32,label:"HP : "+obj.p.hp+" / "+obj.p.maxHp,align:"center",size:16}));
            var opts = ["food"];
            cont.p.h = 20+opts.length*70;
            opts.forEach(function(opt,i){
                var bCont = cont.insert(new Q.InfoBox({x:10,y:10+i*70,w:180,h:70,cx:0,cy:0}));
                bCont.insert(new Q.Sprite({x:0,y:0,cx:0,cy:0,sheet:"ui_"+opt}));
                var label = obj.p[opt];
                if(Q._isArray(label)){label=label.length;};
                bCont.insert(new Q.HUDText({x:bCont.p.w-10,y:32,label:" x "+label,align:"right"}));
            });
        }
    });
    
    
};
