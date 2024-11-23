const express= require ("express");
const http = require ("http");
const path = require ("path");

const app= express();
app.use(function(req,res){
    console.log("Hi");
    res.end("BYE");
})
app.listen(3000,function(){
    console.log("App started on port 3000");
})