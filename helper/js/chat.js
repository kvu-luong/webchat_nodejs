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
        if(username.val() == ""){
            alert ("Please type your name in textbox!!!");
            return false;
        }
        socket.emit('register', {name: username.val()});
    });
    username.keyup(function(e){
        if(e.keyCode == 13)
        {
            if(username.val() == ""){
                alert ("Please type your name in textbox!!!");
                return false;
            }
            socket.emit('register', {name: username.val()});
        }
    });
         
    socket.on("register-fail", ()=>{
        alert("Username existed");
    });
    socket.on("register-success", (data)=>{
        $(".current-user").html(data.username);
        $(".user-name").hide();
        $(".chat-room").show(2000);
    });
    socket.on("send_user_online_list", (data)=>{
        $("#user-onl_content").html("");
        data.forEach(function(user){
            $("#user-onl_content").append(
                "<div class='user'>"+user+"</div>"
            )
        });
    });
    //logout
    $("#logout").click(function(){
        socket.emit("logout");
    });
    socket.on("someone_logout", (data)=>{
        $("#user-onl_content").html("");
        data.forEach(function(user){
            $("#user-onl_content").append(
                "<div class='user'>"+user+"</div>"
            )
        });
    });
    socket.on("you_logout", ()=>{
        alert("You log out successful");
        $(".user-name").show(500);
        $(".chat-room").hide();
    })
    //send message
    btnChat.click(function(e){
        e.preventDefault();
        if(message.val() == ""){
            return false;
        }
        socket.emit('new_message', {message: message.val()});
        message.val("");
    });
    //get message 
    socket.on("self_update_message", (data)=>{
        chatroom.append("<div class='message self_position'>"+
            "<div class='horizontal_m'>"+
                " <span class='user' style='margin-top: 10px'>" + data.username +"  </span>"+
                " <span class='m-content' style='background-color:"+data.color+"'>"+ data.message + "</span> "+
            "</div>"
            +"<div>"+
                "<span class='m-time' style='justify-content: flex-end'>"+data.time+"</span>"+ 
            "</div>"
         +"</div>");
    });
    socket.on("other_update_message", (data)=>{
        chatroom.append("<div class='message'> <span class='user'>" + data.username +"</span>  "+
         "<span class='m-content' style='background-color:"+data.color+"'>"+ data.message + "</span>"
         +"<span class='m-time'  style='justify-content: flex-start'>"+data.time+"</span>"
         +"</div>")
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
    });

})