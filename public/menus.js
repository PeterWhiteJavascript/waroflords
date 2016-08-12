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
        Q.inMenu=true;
        var xOffset = 10;
        var cont = stage.insert(new Q.InfoBox({x:0,y:0,w:Q.width,h:Q.height,fill:"black"}));
        cont.insert(new Q.MenuText({x:cont.p.w/2,y:10,label:"Select your lord"}));
        var lords = ["ma_teng","xu_sheng","donkey_kong"];        
        var lordObjects = [];
        var lordsDisplaying = 3;
        lords.forEach(function(lord){
            var lordBanner = cont.insert(new Q.LordBanner({w:cont.p.w/lordsDisplaying-lordsDisplaying*10,h:cont.p.h-60,data:Q.assets["lords.json"][lord],lord:lord}));
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
    });
    Q.scene("showVSstats",function(stage){
        var self = Q.state.get("self");
        var opponent = Q.state.get("opponent");
        var cont = stage.insert(new Q.InfoBox({x:0,y:0,w:Q.width,h:Q.height,fill:"black"}));
        var selfLord = cont.insert(new Q.LordBanner({x:10,y:50,w:cont.p.w/3,h:cont.p.h-60,data:self.lord,lord:self.lord.id}));
        selfLord.showStats();
        selfLord.add("tween");
        var opponentLord = cont.insert(new Q.LordBanner({x:cont.p.w-10,y:50,w:cont.p.w/3,h:cont.p.h-60,data:opponent.lord,lord:opponent.lord.id}));
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
            Q.inMenu=false;

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
    Q.scene("turnStart",function(stage){
        var obj;
        if(Q.state.get("self").turn){
            obj = stage.insert(new Q.Sprite({cx:0,cy:0,x:0,y:0,sheet:"turn_start",scale:2}));
        } else {
            obj = stage.insert(new Q.Sprite({cx:0,cy:0,x:0,y:0,sheet:"opponents_turn",scale:2}));
        }
        obj.add("tween");
        setTimeout(function(){
            obj.animate({scale:0.1},1,Q.Easing.Quadratic.InOut,{callback:function(){Q.clearStage(5);}});
        },1000);
        
    });
    
    
    
    
    Q.scene("March",function(stage){
        
    });
    Q.scene("Promote",function(stage){
        
    });
    Q.scene("Demote",function(stage){
        
    });
    Q.scene("Repair",function(stage){
        
    });
    Q.scene("townMenu",function(stage){
        var obj = stage.options.obj;
        var cont = stage.insert(new Q.InfoBox({x:10,y:10,w:200}));
        var opts = ["March","Promote","Demote","Repair"];
        cont.p.h = 20+opts.length*50;
        opts.forEach(function(opt,i){
            var bCont = cont.insert(new Q.UI.Container({x:cont.p.w/2,y:35+i*50,w:180,h:50,fill:"red",border:"black",opacity:0.5,type:Q.SPRITE_UI}));
            var text = bCont.insert(new Q.MenuText({x:0,y:-12.5,label:opt}));
            bCont.on("touch",function(){
                Q.stageScene(opt,1,{previousScene:"townMenu"});
            });
        });
    });
    Q.scene("objectStats",function(stage){
        var obj = stage.options.obj;
        
    });
    
    
};
