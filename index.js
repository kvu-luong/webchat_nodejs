const express = require('express');
const app = express();

app.set("view engine", 'ejs');
//middlewares
app.use(express.static(__dirname + '/helper'));//set path to local file


//create socket server
const http = require('http').Server(app);
const io = require("socket.io")(http);

//connect to database
var mysql = require('mysql');
var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'chat'
})
db.connect(function(err){
    if(err) console.log(err);
});
//manage user register
var user_array = [];
var id_array = [];

var room_arr = [];//contain room
var count = 0;// make name different for each room
io.on('connection', (socket) =>{
    console.log("new user connect");
    socket.on("register", (data)=>{
        //check user name in array
        if(user_array.indexOf(data.name) >=0){
            //exist
            socket.emit("register-fail",{message: "Username existed"});
        }else{
            //can register
            socket.username = data.name;
            user_array.push(data.name);
            id_array.push(socket.id);
             //remove socket which register
             var user_arr = user_array.filter(function(element){
                return element != data.name;
            });
            var id_arr = id_array.filter(function(element){
                return element != socket.id;
            });

            socket.emit("register-success", {username: data.name, user_list: user_arr, id: id_arr});
           
            socket.broadcast.emit("send_user_online_list",{username: data.name , id: socket.id});
        }
    });

    socket.on("logout", ()=>{
        //remove this user
        user_array.splice(
            user_array.indexOf(socket.username), 1
        )
        //remove this id
        id_array.splice(
            id_array.indexOf(socket.id), 1
        )
        socket.broadcast.emit("someone_logout", {id_remove: socket.id});
        socket.emit("you_logout");
    })
    var time = new Date(Date.now());
    var minute = time.getMinutes();
    var second = time.getSeconds();
    var hours = time.getHours();
    var real_time = hours+":"+minute+":"+second;
    socket.on('new_message', (data)=>{
        //gửi về chính nó
        socket.emit("self_update_message", 
        {
            message: data.message,
            username: socket.username,
            color: "#00804566"  ,
            time : real_time
        })
        //gửi cho những người khác
        socket.broadcast.emit("other_update_message",
        {
            message: data.message,
            username: socket.username,
            color: "#efe4e4" ,
            time: real_time 
        });
    });
    //private chat
    socket.on("private_chat", (data)=>{
        
        if(room_arr.length <= 0){
            let room = {
                name : "room"+count,
                source : socket.id,
                target : data.user_id,
                total: 1
            }
            socket.join(room.name);
            room_arr.push(room);
            socket.emit("private_id_target",
                {
                    room : room,
                }
             );
             var messages = get_message_from_data(data.user_id, socket.id);
             console.log(messages);
            socket.emit("inital_message_inroom", {
                message: messages,
                room: room,
                user_id: socket.id,
                time: real_time 

            })
        }else{
            for(x = 0; x < room_arr.length ; x++){
                    let sameTarget_diffSource_1 = room_arr[x].source != socket.id && room_arr[x].target == data.user_id;
                    let sameTarget_diffSource_2 = room_arr[x].source == data.user_id && room_arr[x].target !== socket.id;
                    let sameTarget_sameSource = room_arr[x].source == socket.id && room_arr[x].target == data.user_id;
                    let condition_1 = room_arr[x].source == socket.id || room_arr[x].source == data.user_id;
                    let condition_2 = room_arr[x].target == socket.id || room_arr[x].target == data.user_id;
                    let reverseTarget_Source = condition_1 && condition_2;

                    if(sameTarget_diffSource_1 || sameTarget_diffSource_2){
                        count = count + 1;
                        let room_s = {
                            name : "room"+count,
                            source : socket.id,
                            target : data.user_id,
                            total: 1 
                        }
                        socket.join(room_s.name);
                        room_arr.push(room_s);
                        socket.emit("private_id_target",
                            {
                                room : room_s,
                            }
                        );
                        var messages = get_message_from_data(data.user_id, socket.id);
                        socket.emit("inital_message_inroom", {
                            message: messages,
                            room : room_s,
                            user_id: socket.id,
                            time: real_time 
                        })
                    }
                    if(reverseTarget_Source && !sameTarget_sameSource && room_arr[x].total != 2){
                        socket.join(room_arr[x].name);
                        room_arr[x].total = 2;//room full
                        socket.emit("private_id_target",
                            {
                                room : room_arr[x],
                            }
                        );
                        var messages = get_message_from_data(data.user_id, socket.id);
                        socket.emit("inital_message_inroom", {
                            message: messages,
                            room : room_arr[x],
                            user_id: socket.id,
                            time: real_time 
                        })
                    }
                    if(reverseTarget_Source  && !sameTarget_sameSource && room_arr[x].total == 2){
                            socket.emit("private_id_target",
                            {
                                room : room_arr[x],
                            }
                         );
                        var messages = get_message_from_data(data.user_id, socket.id);
                            socket.emit("inital_message_inroom", {
                                message: messages,
                                room: room_arr[x],
                                user_id: socket.id,
                                time: real_time 
                            })
                    }        
            }
        }
    });

    function get_message_from_data($source, $target){
        var sql1 = "SELECT * FROM `chat` WHERE source = '"+$source+"' AND target = '"+$target+"' ORDER BY time DESC";
       var kq = [];
       var getInformationFromDB = function(callback){
       db.query(sql1, function (err, rows, fields) {
          if (err) throw err;
          for (var i in rows){
              kq.push(rows[i].message);
          }
          callback(null, kq);
        }); 
       
    }
    getInformationFromDB(function (err, result){
            if(err) console.log("Database Error")
            else return result;

        });
        console.log(f_result);
    }
    socket.on("private_message", (data)=>{
        //send to itself
        if(data.total == 1){
            var sql = "INSERT INTO chat (source, time ,message, target) VALUES ('"+socket.id+"','"+real_time+"','"+data.message+"','"+data.target_id+"')";
            db.query(sql, function (err, result) {
                if (err) throw err;
            });
            //first element join to room.
            socket.emit("private_self_message",{
                type: 1,
                username: socket.username,
                message: data.message,
                time: real_time,
                color: "#00804566",
            });
        }else{// when total = 2
            socket.emit("private_self_message",{
                type: 1,
                username: socket.username,
                message: data.message,
                time: real_time,
                color: "#00804566",
            });
            socket.broadcast.to(data.room).emit("private_target_message", 
            {
                
                username: socket.username,
                color: "#efe4e4",
                message: data.message,
                time: real_time
            }); 
        }
    }); 
    
    socket.on("close", ()=>{
        for ( x = 0; x < room_arr.length ; x++){
            if(room_arr[x].source == socket.id){
                socket.leave(room_arr[x].name);
                room_arr[x].total = 1;
            }
        }
    })
    //typing action
    socket.on("typing", ()=>{
        socket.broadcast.emit("me_typing", socket.username);
    });
    socket.on("stop_typing",()=>{
        socket.broadcast.emit("me_stop_typing");
    })
    //private typing action
    socket.on("private-typing", ()=>{
        socket.broadcast.emit("private_me_typing", socket.username);
    });
    socket.on("stop_typing",()=>{
        socket.broadcast.emit("private_me_stop_typing");
    })
    socket.on("disconnect",()=>{
        console.log(socket.username +" log out");
    })

   
})
app.get("/", (req, res)=>{
    res.render("home");
})

http.listen(process.env.PORT || 3000 , function(){
    console.log('listening on :3000');
});