$(function(){
   

    var socket = io.connect('http://localhost:3000');
    //hide and show form
    $(".user-name").show(2000);
    $(".chat-room").hide();
    //button
    var btnLogin = $("#btn-login");
    var btnChat = $("#bnt-chat");
    var username = $("#username");
    var message = $("#message");
    var chatroom = $(".content");

    //register username
    btnLogin.click(function(){
        socket.emit('register', {name: username.val()});
    });
    socket.on("register-fail", ()=>{
        alert("Username existed");
    });
    socket.on("register-success", (data)=>{
        $(".current-user").html(data.username);
        $(".user-name").hide();
        $(".chat-room").show(2000);
    })
    socket.on("send_user_online_list", (data)=>{
        $("#user-onl_conent").html("");
        data.forEach(function(user){
            $("#user-onl_conent").append(
                "<div class='user'>"+user+"</div>"
            )
        });
    });
    //logout
    $("#logout").click(function(){
        socket.emit("logout");
    });
    socket.on("someone_logout", (data)=>{
        $("#user-onl_conent").html("");
        data.forEach(function(user){
            $("#user-onl_conent").append(
                "<div class='user'>"+user+"</div>"
            )
        });
    });
    socket.on("you_logout", ()=>{
        alert("You log out successful");
        $(".user-name").show(1000);
        $(".chat-room").hide();
    })
    //send message
    btnChat.click(function(e){
        e.preventDefault();
        socket.emit('new_message', {message: message.val()});
        message.val("");
    });
    //get message 
    socket.on("update_message", (data)=>{
        chatroom.append("<div class='message'>" + data.username +" : "+ data.message + "</div>")
    });

    message.focusin(()=>{
        socket.emit('typing');
    });
    message.focusout(function(){
        socket.emit("stop_typing");
    });
    socket.on('me_typing', (data)=>{
        $(".typing").html(data+" is typing");
    });
    socket.on("me_stop_typing",()=>{
        $(".typing").html("");
    })
})