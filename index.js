const express=require('express');
const app=express();
const path=require('path');
const mongoose=require('mongoose');
const multer=require('multer');
const fs=require('fs');

const routes=require('./routes/web');

require('dotenv').config();
console.log(process.env.PORT);
// console.log('this is mongoose',mongoose);
mongoose.connect(process.env.CONNECTION_STRING,{dbName:"calhard"}).then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ Connection failed', err));;


function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  req.flash('error', 'You must be logged in');
  return res.redirect('/login');
}

//multer for file uploads
// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/dist/uploads/');
    },
    filename: function (req, file, cb) {
      const uniqueName = Date.now() + '-' + file.originalname;
      cb(null, uniqueName);
    }
  });

  const upload = multer({ storage });


  const session = require('express-session');
const flash = require('connect-flash');

app.use(session({
  secret: 'someSecretKey', // keep this secure
  resave: false,
  saveUninitialized: true
}));
app.use(flash());

app.use(express.json());

// Make flash messages available to all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.set('view engine','ejs');

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Optional: If you expect JSON requests too
app.use(express.json());

app.use('/admin/assets',express.static(path.join(__dirname,'public')));

app.get('/admin',(req,res)=>{

    res.render('dashboard');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    req.flash('error', 'Invalid credentials');
    return res.redirect('/login');
  }

  req.session.userId = user._id; // store user session
  req.flash('success', 'Logged in successfully');
  res.redirect('/admin/home');
});

app.get('/admin/home',async(req,res)=>{

    const data = await mongoose.connection.db.collection('homepage').findOne({});
    console.log(data);
    res.render('homepage',{section:data||{}});
});

app.get('/admin/login',(req,res)=>{
  res.render('auth/login');
})

app.post('/admin/test', upload.single('sec1image'), async (req, res) => {


  try{

    const collection = mongoose.connection.db.collection('homepage');

    // 1. Find existing document
    const existingDoc = await collection.findOne({ page: "homepage" });
  
    // 2. If there's an old image and new one is uploaded, delete the old image file
    if (existingDoc && existingDoc.sec1image && req.file) {
      const oldImagePath = path.join(__dirname, 'public', existingDoc.sec1image);
      fs.unlink(oldImagePath, err => {
        if (err) console.log('Old image delete failed:', err);
        else console.log('Old image deleted:', oldImagePath);
      });
    }
  
    // 3. Build new image path
    const newImagePath = req.file ? '/uploads/' + req.file.filename : existingDoc?.sec1image || null;
  
    // 4. Build form data
    const formData = {
      page: "homepage",
      sec1title1:req.body.sec1title1,
      sec1title2:req.body.sec1title2,
      sec1text: req.body.sec1text,
      sec1image: newImagePath,
      sec1btn_text: req.body.sec1btn_text,
      sec1btn_url: req.body.sec1btn_url,
    };
  
    // 5. Update or insert

    await collection.findOneAndUpdate(
        {},                   // Empty filter → first document
        { $set: formData },       // Fields to update
        { upsert: true }      // Insert if not found
      );
    // await collection.updateOne(
    //   { page: "homepage" },
    //   { $set: formData },
    //   { upsert: true }
    // );
 
    req.flash('success', 'All changes have been applied.');
res.redirect('/admin/home');

  }catch(er){

    req.flash('error', 'Something went wrong');
    res.redirect('/admin/home');
  }
    
    
  });


  //api routes come in here 

  app.get('/api/homepage',async(req,res)=>{

    const data = await mongoose.connection.db.collection('homepage').findOne({});
    console.log(data);
    res.json({data:data});
  });

// hello
app.listen(process.env.PORT,(er)=>{
  if (er) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
    console.log('the server is listening',`http://localhost:${process.env.PORT}`);
});


