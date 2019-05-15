const express = require('express');

const app = express()
const session = require("express-session");
const SocketIOFile = require('socket.io-file');

app.set("view engine", 'ejs');
//middlewares
app.use(express.static('helper'));//set path to local file


// app.use(session({

//     secret: 'random_string_goes_here',
//   }));

// const router = require('./router');

// app.use('/upload', router);



app.get('/socket.io-file-client.js', (req, res, next) => {
	return res.sendFile(__dirname + '/node_modules/socket.io-file-client/socket.io-file-client.js');
});


//create socket server
const http = require('http').Server(app);
const io = require("socket.io")(http);

//connect to database
// var mysql = require('mysql');
// var db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     database: 'chat'
// })
// db.connect(function(err){
//     if(err) console.log(err);
// });
// //manage user register
var user_array = [];
var id_array = [];

var room_arr = [];//contain room
var count = 0;// make name different for each room
var temp_array = [];
io.on('connection', (socket) =>{


	var count = 0;
	var uploader = new SocketIOFile(socket, {
		// uploadDir: {			// multiple directories
		// 	music: 'data/music',
		// 	document: 'data/document'
		// },
		uploadDir: 'helper/upload_file',							// simple directory
		// accepts: ['audio/mpeg', 'audio/mp3'],		// chrome and some of browsers checking mp3 as 'audio/mp3', not 'audio/mpeg'
		// maxFileSize: 4194304, 						// 4 MB. default is undefined(no limit)
		chunkSize: 10240,							// default is 10240(1KB)
		transmissionDelay: 0,						// delay of each transmission, higher value saves more cpu resources, lower upload speed. default is 0(no delay)
		overwrite: false, 							// overwrite file if exists, default is true.
		rename: function(filename) {
			var split = filename.split('.');	// split filename by .(extension)
			var fname = split[0];	// filename without extension
			var ext = split[1];

			return `${fname}_${count++}.${ext}`;
		}
		// rename: 'MyMusic.mp3'
	});

	socket.on("send-file", function(data){
        var time = new Date(Date.now());
        var minute = time.getMinutes();
        var second = time.getSeconds();
        var hours = time.getHours();
        var real_time = hours+":"+minute+":"+second;
		var infor = {
			"name": data.fileInfo.name,
			"dir": data.fileInfo.uploadDir,
		}
		socket.emit("self-show-image",{
            "fileInfo": infor,
            "time": real_time,
            "color": "#00804566"
        });
        socket.broadcast.emit("other-show-image",{
            "fileInfo": infor,
            "time": real_time,
            "color": "#efe4e4"
        });
        infor.dir = "empty";
	})
	uploader.on('start', (fileInfo) => {
		console.log('Start uploading');
		console.log(fileInfo);
	});
	uploader.on('stream', (fileInfo) => {
		console.log(`${fileInfo.wrote} / ${fileInfo.size} byte(s)`);
	});
	uploader.on('complete', (fileInfo) => {
		console.log('Upload Complete.');
		console.log(fileInfo);
	});
	uploader.on('error', (err) => {
		console.log('Error!', err);
	});
	uploader.on('abort', (fileInfo) => {
		console.log('Aborted: ', fileInfo);
    });
    

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
   
    socket.on('new_message', (data)=>{
        var time = new Date(Date.now());
        var minute = time.getMinutes();
        var second = time.getSeconds();
        var hours = time.getHours();
        var real_time = hours+":"+minute+":"+second;
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
                total: 1,
                username: data.user_name
            }
            socket.join(room.name);
            room_arr.push(room);
            socket.emit("private_id_target",
                {
                    room : room,
                }
             );
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
                            total: 1 ,
                            username: data.user_name
                        }
                        socket.join(room_s.name);
                        room_arr.push(room_s);
                        socket.emit("private_id_target",
                            {
                                room : room_s,
                            }
                        );
                    }
                    if(reverseTarget_Source && !sameTarget_sameSource && room_arr[x].total != 2){
                        socket.join(room_arr[x].name);
                        room_arr[x].total = 2;//room full
                        socket.emit("private_id_target",
                            {
                                room : room_arr[x],
                            }
                        );
                    }
                    if(reverseTarget_Source  && !sameTarget_sameSource && room_arr[x].total == 2){
                            socket.emit("private_id_target",
                            {
                                room : room_arr[x],
                            }
                         );
                    }        
            }
        }
    });


    socket.on("private_message", (data)=>{
        var time_1 = new Date(Date.now());
        var minute_1 = time_1.getMinutes();
        var second_1 = time_1.getSeconds();
        var hours_1 = time_1.getHours();
        var real_time_1 = hours_1+":"+minute_1+":"+second_1;
        //send to itself
        console.log(data.total);
            if(data.total == 1){
                //first element join to room.
                socket.emit("private_self_message",{
                    type: 2,
                    username: socket.username,
                    message: data.message,
                    time: real_time_1,
                    color: "#00804566",
                });
                console.log("on check_arr_2");
                var check_arr_2 = temp_array.map(function(value, index, arr){
                    return value.message;
                });
                console.log("check"+ check_arr_2);
                var check_exist = 0;// not exist
                var check_arr_1 = temp_array.filter(function(value, index, arr){//get all element contain donks message
                    return value.message == "donks";
                });
                var check_id_contain_donks = check_arr_1.map(function(value, index, arr){// array id have message donks
                    return value.id;
                })
                console.log("check id"+ check_id_contain_donks+"-=="+data.source+data.target_id);
                if(check_id_contain_donks.includes(data.source+data.target_id) ){
                    check_exist = 1;
                }
              
               
                if(check_exist == 0 ){//exist and already done
                    temp_arr = {
                        "id": data.source+data.target_id,
                        "message": data.message,
                        "username": socket.username
                    }
                    temp_array.push(temp_arr);//store all inital message in array
                  console.log("inside check exist");
                 }
            }else{// when total = 2
                if(temp_array.length > 0){
                    temp_arr = {
                        "id": data.source+data.target_id,
                        "message": data.message,
                        "username": socket.username
                    }
                    temp_array.push(temp_arr);//thêm tin nhắn mới tới khi mà user khác vừa vào phòng
                    var mess_arr = temp_array.filter(function(value, index, arr){
                        return value.id ==  data.source+data.target_id;
                    })//lọc id
                    var mess_final = mess_arr.filter(function(value, index, arr){
                        return value.message != "donks";
                    }); //lọc message
                    socket.emit("private_self_message",{
                        type: 1,
                        username: socket.username,
                        rows: mess_final,
                        time: real_time_1,
                        color: "#efe4e4",
                    });
                  //reset array after send initial message
                  var rest_array = temp_array.filter(function(value, index, arr){
                        return value.id != data.source+data.target_id;
                  });
                  rest_array.push({
                      "id": data.source+data.target_id,
                      "message": "donks",
                      "username": data.username

                  })
                  temp_array = rest_array;
                }else{
                    socket.emit("private_self_message",{
                        type: 2,
                        username: socket.username,
                        message: data.message,
                        time: real_time_1,
                        color: "#00804566",
                    });
                    console.log("outside done");
                }
            }
       
        
        //both case
        socket.broadcast.to(data.room).emit("private_target_message", 
        {
            username: socket.username,
            color: "#efe4e4",
            message: data.message,
            time: real_time_1
        }); 
    }); 
    
    socket.on("close", (data)=>{
       var id; //id message out 
     
        for ( x = 0; x < room_arr.length ; x++){
            //var dk_1 = room_arr[x].target == socket.id && room_arr[x].total == 2;
            var dk_2 = room_arr[x].source == socket.id && room_arr[x].target == 1;
            if(dk_2){
                socket.leave(room_arr[x].name);
                room_arr[x].total = 1;
                id = room_arr[x].source+room_arr[x].target;
            }
        }
        console.log(id+"-"+socket.username);
        // temp_array = temp_array.filter(function(value, index, arr){//remove message donks
        //     return value.id != id;
        // })
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