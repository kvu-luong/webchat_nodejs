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
        io.sockets.emit('update_message',
        {
            message: data.message,
            username: socket.username
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