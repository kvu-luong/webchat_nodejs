const express = require('express');
const app = express();

app.set("view engine", 'ejs');
//middlewares
app.use(express.static(__dirname + '/helper'));//set path to local file


//create socket server
const http = require('http').Server(app);
const io = require("socket.io")(http);

//manage user register
var user_array = [];
io.on('connection', (socket) =>{
    console.log("new user connect");
    socket.on("register", (data)=>{
        //check user name in array
        if(user_array.indexOf(data.name) >=0){
            //exist
            socket.emit("register-fail",{message: "Username existed"});
        }else{
            //can register
            user_array.push(data.name);
            socket.username = data.name;
            socket.emit("register-success", {username: data.name});
            io.sockets.emit("send_user_online_list", user_array);
        }
    });

    socket.on("logout", ()=>{
        //remove this user
        user_array.splice(
            user_array.indexOf(socket.username), 1
        )
        socket.broadcast.emit("someone_logout", user_array);
        socket.emit("you_logout");
    })
    socket.on('new_message', (data)=>{
        console.log(data.message);
        //gửi về chính nó
        var time = new Date(Date.now());
        var minute = time.getMinutes();
        var second = time.getSeconds();
        var hours = time.getHours();
        var real_time = hours+":"+minute+":"+second;
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
    //typing action
    socket.on("typing", ()=>{
        socket.broadcast.emit("me_typing", socket.username);
    });
    socket.on("stop_typing",()=>{
        socket.broadcast.emit("me_stop_typing");
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