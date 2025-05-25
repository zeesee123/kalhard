const express=require('express');
const app=express();

require('dotenv').config();

app.set('view engine','ejs');

app.get('/',(req,res)=>{

    console.log('my project works absolutely fine');
    res.send('hey');
});

// hello
app.listen(process.env.PORT,()=>{
    console.log('the server is listening');
});


