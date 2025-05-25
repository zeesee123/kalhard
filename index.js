const express=require('express');
const app=express();

require('dotenv').config();

app.set('view engine','ejs');

app.get('/admin',(req,res)=>{

    res.render('home');
});

// hello
app.listen(process.env.PORT,()=>{
    console.log('the server is listening');
});


