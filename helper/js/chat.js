$(function(){
   
    var socket = io.connect('http://localhost:3000');
    //hide and show form
    $(".user-name").show(2000);
    $(".chat-room").hide();
    //button
    var btnLogin = $("#btn-login");
    var btnChat = $("#btn-chat");
    var username = $("#username");
    var message = $("#message");
    var chatroom = $(".message-chat");

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

        $("#user-onl_content").html("");
        for( var x = 0; x < data.user_list.length; x++){
            $("#user-onl_content").append(
                "<div class='user'><button class='private_user' id='"+data.id[x]+"'>"+data.user_list[x]+"</button></div>"
            )
        }
        $(".private_user").click(function(){
           var id = $(this).attr('id');
           var name = $(this).text();
            $(".private").show();
            $(".chat-with").html(name);
            $(".chat-room").hide();
            socket.emit("private_chat", {user_id: id, user_name: name});
        });
    });
    //add private chat when user list have been send back
    $(".private").hide();
    socket.on("send_user_online_list", (data)=>{
        $("#user-onl_content").append(
            "<div class='user'><button class='private_user' id='"+data.id+"'>"+data.username+"</button></div>"
        )
        $(".private_user").click(function(){
           var id = $(this).attr('id');
           var name = $(this).text();
            $(".private").show();
            $(".chat-with").html(name);
            $(".chat-room").hide();
            socket.emit("private_chat", {user_id: id, user_name: name});
            //check room exist or not
            socket.on("inital_message_inroom", function(data){
            console.log(data.message);
                if(data.user_id == data.room.target && data.room.source == id ){
                   if(data.message.length > 0){
                       message.forEach(function(element){
                        $(".private-message_chat").append(
                            "<div class='message self_position'>"+
                            "<div class='horizontal_m'>"+
                                " <span class='user' style='margin-top: 10px'>" + name +"  </span>"+
                                " <span class='m-content' style='background-color:#00804566'>"+ element+ "</span> "+
                            "</div>"
                            +"<div>"+
                                "<span class='m-time' style='justify-content: flex-end ; padding-top: 0px;'>"+data.time+"</span>"+ 
                            "</div>"
                        +"</div>");
                       })
                   }
                }
            });
        });
        //start event
    });
    //logout
    $("#logout").click(function(){
        socket.emit("logout");
    });
    socket.on("someone_logout", (data)=>{
       $("#"+data.id_remove).remove();
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
                "<span class='m-time' style='justify-content: flex-end ; padding-top: 0px;'>"+data.time+"</span>"+ 
            "</div>"
         +"</div>");
    });
    socket.on("other_update_message", (data)=>{
        chatroom.append("<div class='message' style='align-self: flex-start;'> <span class='user'>" + data.username +"</span>  "+
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
    $(".typing").hide();
    socket.on('me_typing', (data)=>{
        $(".name_of_user").html(data);
        $(".typing").show(); 
    });
    socket.on("me_stop_typing",()=>{
        $(".name_of_user").html("");
        $(".typing").hide();
    });

    //private chat
    let room_name;
    socket.on("private_id_target", function(data){
        room_name = data;
    });
    $("#bnt-private__chat").click(function(){
        if($("#private_message").val() == ""){
            return false;
        }  
        socket.emit("private_message",
        {
            room: room_name.room.name,
            message : $("#private_message").val(),
            target_id: room_name.room.target,
            source : room_name.room.source,
            total : room_name.room.total
        }
        );
        $("#private_message").val("");
        console.log(room_name.room.name);
    });
    socket.on("private_self_message", function(data){
        //check first orign or not
            $(".private-message_chat").append(
                "<div class='message self_position'>"+
                "<div class='horizontal_m'>"+
                    " <span class='user' style='margin-top: 10px'>" + data.username +"  </span>"+
                    " <span class='m-content' style='background-color:"+data.color+"'>"+ data.message + "</span> "+
                "</div>"
                +"<div>"+
                    "<span class='m-time' style='justify-content: flex-end ; padding-top: 0px;'>"+data.time+"</span>"+ 
                "</div>"
            +"</div>");
        
    });
    socket.on("private_target_message", function(data){
            $(".private-message_chat").append(
                "<div class='message' style='align-self: flex-start;'>" 
                    +"<span class='user'>" +data.username+"</span>  "+
                    "<span class='m-content' style='background-color:"+data.color+"'>"+ data.message + "</span>"
                    +"<span class='m-time'  style='justify-content: flex-start'>"+data.time+"</span>"
                +"</div>"
                );
        
    });
    $("#close").click(function(){
        socket.emit("close");
        $(".private-message_chat").html("");
        $(".private").hide();
        $(".chat-room").show(500);
    })
    //private typing action
    $(".private-typing").hide();
    socket.on('private_me_typing', (data)=>{
        $(".name_of_user").html(data);
        $(".typing").show(); 
    });
    socket.on("private_me_stop_typing",()=>{
        $(".name_of_user").html("");
        $(".typing").hide();
    });
    //test database

   // socket.on('initial_notes', (data)=>{
       // for (var i = 0; i < data.length; i++){
            // We store html as a var then add to DOM after for efficiency
          //  console.log(data[i].note);
        //}
    //})

})