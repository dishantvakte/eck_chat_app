var express = require('express');
var app = express();
var server = require('http').Server(app);
var client = require('socket.io')(server).sockets;
var path = require('path');
var ip = require('ip');
var mongo = require('mongodb').MongoClient;

var port = 8080;
var users = [];

//connect to mongo
mongo.connect('mongodb://localhost:27017/chatdb', function(err, db){
    if(err){
        throw err;
    }
    else{
        console.log('Mongo Connected');
    }

    const database= db.db('chatdb');



    //Connect to socket
client.on('connection', function(socket){
    console.log('New connection made');
    let chat = database.collection('chats');

    //create function to send status
    SendStatus = function(s){
        socket.emit('status', s) //emits status event that resides in the client side somewhere
    }
    //Get chats from mongo collection
    chat.find().limit(100).sort({ _id:1}).toArray(function(err, res){       //first 100 chats sorted by id... _id :1(true).. all the documents to be extracted to array
        if(err){
            throw err
        }
    
        //Emit the messages
        socket.emit('output', res); //we have output at client side that will display all the response in the chat box
    
    }) 
   

    //handle input event.. for button clicks at client side

    socket.on('input', function(data){
        let name = data.name;
        let message= data.message;
        //check for name and messages
        if(name =="" || message == ""){
            //send error status
            SendStatus('Please enter name and message');
        }
        else{
             //insert messages
            chat.insert({name: name , message: message}, function(){
                client.emit('output', [data]);                  //insert messages to ouput array to user can see the updated chat
                
            //send status objects 
                SendStatus({
                    message: 'Message sent',
                    clear: true
                })
            })
        }
    });

    //Handling clear... if user wants to clear all the chats
    socket.on('clear', function(data){
        //Remove all chats from collection
        chat.remove({}, function(){
            socket.emit('cleared')
        })
    })


   socket.on('disconnect',function(){
        console.log('A user is disconnected');
    })

})
})
 
app.get('/', function(req,res){
    res.sendfile('index.html');
})

server.listen(port, function(){
    console.log("server is listening at http://"+ ip.address() + ":" + port);
})