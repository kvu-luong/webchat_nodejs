$(document).ready(function(){
   //select and upload file
    $("#select-file").on("click", function(){
        $("#file").click();//get file
    });

    $("#btn-chat").on("click",function(){
        $("#get_image").click();//upload file
    });
       

   //---------------------------
    var socket = io.connect('http://localhost:3000');
    //var socket = io.connect('https://gochatnow.herokuapp.com/');
   //upload file with socket-io-file
   var uploader = new SocketIOFileClient(socket);
   var form = document.getElementById('form');
   
   uploader.on('ready', function() {
       console.log('SocketIOFile ready to go!');
   });
   uploader.on('loadstart', function() {
       console.log('Loading file to browser before sending...');
   });
   uploader.on('progress', function(progress) {
       console.log('Loaded ' + progress.loaded + ' / ' + progress.total);
   });
   uploader.on('start', function(fileInfo) {
       console.log('Start uploading', fileInfo);
   });
   uploader.on('stream', function(fileInfo) {
       console.log('Streaming... sent ' + fileInfo.sent + ' bytes.');
   });
   uploader.on('complete', function(fileInfo) {
       console.log('Upload Complete', fileInfo);
       
       socket.emit("send-file", {
           "fileInfo": fileInfo
       })
       
   });
   socket.on("self-show-image", function(data){
       if(data.fileInfo.dir != "empty"){
       var infor = {
           "name": data.fileInfo.name,
           "dir": data.fileInfo.dir,
       }
       var link = infor.dir.split("\\")[1]+"\\"+infor.dir.split("\\")[2];
       
       $(".message-chat").append("<div class='message self_position'>"+
           "<div class='horizontal_m'>"+
               " <a data-fancybox='gallery' href='"+link+"'><img class='user' style='margin-top: 10px ; background-color:"+data.color+";' src='" + link +"'></a>"+
           "</div>"
        +"</div>");
        //scroll bar
        $('.message-chat').scrollTop(parseInt($('.message-chat')[0].scrollHeight));
    }
   })

   socket.on("other-show-image", function(data){
    if(data.fileInfo.dir != "empty"){
    var infor = {
        "name": data.fileInfo.name,
        "dir": data.fileInfo.dir,
    }
    var link = infor.dir.split("\\")[1]+"\\"+infor.dir.split("\\")[2];
       $(".message-chat").append("<div class='message' style='align-self: flex-start;'>" +
       "<a data-fancybox='gallery' href='"+link+"'><img class='m-content' style='background-color:"+data.color+"' src='"+ link +"' ></a>"
       +"</div>");
    //scroll bar
    $('.message-chat').scrollTop(parseInt($('.message-chat')[0].scrollHeight));
    }
   });
   uploader.on('error', function(err) {
       console.log('Error!', err);
   });
   uploader.on('abort', function(fileInfo) {
       console.log('Aborted: ', fileInfo);
   });
   
   form.onsubmit = function(ev) {
       ev.preventDefault();
       
       // Send File Element to upload
       var fileEl = document.getElementById('file');
       // var uploadIds = uploader.upload(fileEl);
   
       // Or just pass file objects directly
       var uploadIds = uploader.upload(fileEl.files);
       //reset input file code awesome
        $('#file').wrap('<form>').closest('form').get(0).reset();
        $('#file').unwrap();
       
        
        
   };
   //-----------------------

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
    var previous_target = $(".chat-with").text();
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
            var now_target = $(".chat-with").text();
            console.log(previous_target+"-"+now_target);
       
            if(previous_target != now_target && previous_target != undefined){
                $(".private-message_chat").html("");
                previous_target = $(".chat-with").text();
            }
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
         //scroll bar
        $('.message-chat').scrollTop(parseInt($('.message-chat')[0].scrollHeight));
    });
    socket.on("other_update_message", (data)=>{
        chatroom.append("<div class='message' style='align-self: flex-start;'> <span class='user'>" + data.username +"</span>  "+
         "<span class='m-content' style='background-color:"+data.color+"'>"+ data.message + "</span>"
         +"<span class='m-time'  style='justify-content: flex-start'>"+data.time+"</span>"
         +"</div>");

         //scroll bar
        $('.message-chat').scrollTop(parseInt($('.message-chat')[0].scrollHeight));

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
            total : room_name.room.total,
            username: room_name.room.username
        }
        );
        $("#private_message").val("");
        
    });
    socket.on("private_self_message", function(data){
        //check first orign or not
        if(data.type == 1){
            for(var i = 0; i< data.rows.length; i++){
                if( i == data.rows.length - 1){//last message
                    $(".private-message_chat").append(
                
                        "<div class='message self_position'>"+
                        "<div class='horizontal_m'>"+
                            " <span class='user' style='margin-top: 10px'>" + data.username +"  </span>"+
                            " <span class='m-content' style='background-color:#00804566'>"+  data.rows[i].message  + "</span> "+
                        "</div>"
                        +"<div>"+
                            "<span class='m-time' style='justify-content: flex-start ; padding-top: 0px;'>"+data.time+"</span>"+ 
                        "</div>"
                        +"<input type='hidden' value='"+data.target+"' class='target_id' >"
                    +"</div>"
                    );
                }else{
                $(".private-message_chat").append(
                    "<div class='message' style='align-self: flex-end;'>" 
                        +"<span class='user'>" +data.rows[i].username+"</span>  "+
                        "<span class='m-content' style='background-color:"+data.color+"'>"+ data.rows[i].message + "</span>"
                        +"<span class='m-time'  style='justify-content: flex-end'>"+data.time+"</span>"
                        +"<input type='hidden' value='"+data.target+"' class='target_id' >"
                    +"</div>"
                    );
                } 
            }
        }else{
                    $(".private-message_chat").append(
                
                        "<div class='message self_position'>"+
                        "<div class='horizontal_m'>"+
                            " <span class='user' style='margin-top: 10px'>" + data.username +"  </span>"+
                            " <span class='m-content' style='background-color:"+data.color+"'>"+ data.message + "</span> "+
                        "</div>"
                        +"<div>"+
                            "<span class='m-time' style='justify-content: flex-start ; padding-top: 0px;'>"+data.time+"</span>"+ 
                        "</div>"
                    +"</div>"
                    );
            }
        
    });
    socket.on("private_target_message", function(data){
            $(".private-message_chat").append(
                "<div class='message' style='align-self: flex-end;'>" 
                    +"<span class='user'>" +data.username+"</span>  "+
                    "<span class='m-content' style='background-color:"+data.color+"'>"+ data.message + "</span>"
                    +"<span class='m-time'  style='justify-content: flex-end'>"+data.time+"</span>"
                +"</div>"
                );
        
    });
  
    $("#close").click(function(){
        var user_target = $(".target_id").val();
        socket.emit("close",{
            "target": user_target,
        });

        //$(".private-message_chat").html("");
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