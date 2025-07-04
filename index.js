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
mongoose.connect(process.env.CONNECTION_STRING,{dbName:process.env.DB_NAME}).then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ Connection failed', err));

//helper functions
function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  req.flash('error', 'You must be logged in');
  return res.redirect('/login');
}

//function for capitalizing the first letter 
function ucfirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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

app.post('/admin/login', async (req, res) => {
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


app.get('/admin/homenew',async(req,res)=>{

    const data = await mongoose.connection.db.collection('homepage').findOne({});
    console.log(data);
    res.render('homepagenew',{section:data||{}});
});

app.get('/admin/login',(req,res)=>{
  res.render('auth/login');
})

// app.post('/admin/test', upload.single('sec1image'), async (req, res) => {

  app.post('/admin/test', upload.fields([
    { name: 'sec1image', maxCount: 1 },
    { name: 'sec2_simg' } // handles all journey card images
  ]), async (req, res) => {
  


  try{

    const collection = mongoose.connection.db.collection('homepage');

    // 1. Find existing document
    const existingDoc = await collection.findOne({ page: "homepage" });
  
    // 2. If there's an old image and new one is uploaded, delete the old image file
    const sec1imageFile = req.files?.sec1image?.[0];

if (existingDoc && existingDoc.sec1image && sec1imageFile) {
  const oldImagePath = path.join(__dirname, 'public', existingDoc.sec1image);
  fs.unlink(oldImagePath, err => {
    if (err) console.log('Old image delete failed:', err);
    else console.log('Old image deleted:', oldImagePath);
  });
}

const newImagePath = sec1imageFile ? '/uploads/' + sec1imageFile.filename : existingDoc?.sec1image || null;

    //journey entries
    const existingEntries = existingDoc?.sec2_entries || [];
let usedIds = existingEntries.map(e => parseInt(e.id)).filter(id => !isNaN(id));
let currentCounter = usedIds.length > 0 ? Math.max(...usedIds) + 1 : 1;

const titles = req.body.sec2_stitle || [];
const contents = req.body.sec2_scontent || [];
const images = req.files?.sec2_simg || [];

const journeyEntries = [...existingEntries]; // start with existing ones

for (let i = 0; i < titles.length; i++) {
  // Optional: skip blank entries
  if (!titles[i] && !contents[i] && !images[i]) continue;

  journeyEntries.push({
    id: currentCounter.toString(),
    title: titles[i],
    content: contents[i],
    image: images[i] ? '/uploads/' + images[i].filename : null
  });

  currentCounter++;
}
    // 4. Build form data
    const formData = {
      page: "homepage",
      sec1title1:req.body.sec1title1,
      sec1title2:req.body.sec1title2,
      sec1text: req.body.sec1text,
      sec1image: newImagePath,
      sec1btn_text: req.body.sec1btn_text,
      sec1btn_url: req.body.sec1btn_url,
      sec2title1:req.body.sec2title1,
      sec2title2:req.body.sec2title2,
      sec2_entries: journeyEntries
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

    console.log(er.message);

    req.flash('error', 'Something went wrong');
    res.redirect('/admin/home');
  }
    
    
  });

  //routes for loading the table data

  app.get('/admin/table/:page/:entries',async(req,res)=>{


    const { page, entries } = req.params;  // e.g., "homepage", "sec2_entries"
  const collection = mongoose.connection.db.collection(page);

  try {
    const doc = await collection.findOne({ page });

    if (!doc || !doc[entries]) {
      return res.status(200).json({ data: [] });
      //return res.status(404).json({ data: [], message: 'No entries found' });
    }

    const data = [];
    let c = 1;

    for (const item of doc[entries]) {
      const formatted = {
        id: c++,
        ...(item.title && { title: item.title }),
        ...(item.content && { content: item.content }),
        ...(item.image && {
          image: `<img src="/admin/assets/dist${item.image}" style="width: 100px; height: auto; object-fit: contain;">`
        }),
        actions: `
          <button type="button" class="btn btn-success editer" data-id="${c - 1}" data-type="${entries}" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
            <i class="bi bi-pencil-square mx-1"></i> EDIT
          </button>
          <button type="button" class="btn btn-danger mx-1 eradicator" data-id="${c - 1}" data-type="${entries}" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
            <i class="bi bi-trash3-fill mx-1"></i> DELETE
          </button>
        `
      };

      data.push(formatted);
    }

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }

  });


  app.get('/admin/landingpage/:page',async(req,res)=>{

    const data = await mongoose.connection.db.collection('landingpage').findOne({page:req.params.page});
    console.log(data);
    

    res.render('landingpage',{section:data||{},page:req.params.page,ucfirst});
  });

  app.get('/admin/add_blog',(req,res)=>{

    res.render('add_blog',{ucfirst});
  });


  app.get('/admin/view_blogs',(req,res)=>{


    res.render('');
  });

  app.get('/admin/create_category',(req,res)=>{

    res.render('');

  });

  app.get('/admin/create_subcategory',(req,res)=>{


    res.render('');
  });

  app.post('/admin/landingpage',upload.fields([
    { name: 'hero_image', maxCount: 1 },
    { name: 'knowmore_image', maxCount: 1 },
    { name: 'businessinvalue_img' } // handles all journey card images
  ]),async(req,res)=>{

    console.log('hit');
  


    // ✅ Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created:', uploadsDir);
  }
    
      try {
        const collection = mongoose.connection.db.collection('landingpage');
    
        // 1. Find existing document
        const existingDoc = await collection.findOne({ page: req.body.page });
    
        // 2. Hero image handling
        const heroimageFile = req.files?.hero_image?.[0];
        if (existingDoc && existingDoc.hero_image && heroimageFile) {
          const oldImagePath = path.join(__dirname, 'public', existingDoc.hero_image);
          fs.unlink(oldImagePath, err => {
            if (err) console.log('Old hero image delete failed:', err);
            else console.log('Old hero image deleted:', oldImagePath);
          });
        }
        const newHeroImagePath = heroimageFile ? '/uploads/' + heroimageFile.filename : existingDoc?.hero_image || null;
    
        // 3. Know more image handling
        const knowmoreImageFile = req.files?.knowmore_image?.[0];
        const knowmoreImagePath = knowmoreImageFile
          ? '/uploads/' + knowmoreImageFile.filename
          : existingDoc?.knowmoreimage || null;
    
        // 4. Business value cards handling (previously sec2_entries)
        const existingBusinessCards = existingDoc?.business_cards || [];
        let usedIds = existingBusinessCards.map(e => parseInt(e.id)).filter(id => !isNaN(id));
        let currentCounter = usedIds.length > 0 ? Math.max(...usedIds) + 1 : 1;
    
        const businessTitles = req.body.businessinvalue_stitle || [];
        const businessContents = req.body.businessinvalue_scontent || [];
        const businessImages = req.files?.businessinvalue_img || [];
    
        const businessCards = [...existingBusinessCards];
        for (let i = 0; i < businessTitles.length; i++) {
          if (!businessTitles[i] && !businessContents[i] && !businessImages[i]) continue;
    
          businessCards.push({
            id: currentCounter.toString(),
            number: businessTitles[i],
            content: businessContents[i],
            image: businessImages[i] ? '/uploads/' + businessImages[i].filename : null
          });
    
          currentCounter++;
        }
    
        // 5. Construct final data
        const formData = {
          page: req.body.page || "homepage",
    
          // Hero section
          hero_title1: req.body.hero_title1,
          hero_title2: req.body.hero_title2,
          hero_content: req.body.hero_content,
          hero_image: newHeroImagePath,
          herobtn_text: req.body.herobtn_text,
          herobtn_url: req.body.herobtn_url,
    
          // Calsoft in focus
          calsoftinfocus_title: req.body.calsoftinfocus_title,
          calsoftinfocus_checkboxtext: req.body.calsoftinfocus_checkboxtext,
          calsoftinfocus_text: req.body.calsoftinfocus_text,
          hubspot_form:req.body.hubspot_form,
    
          // Business value section
          business_cards: businessCards,
    
          // Know more section
          knowmore_title1: req.body.knowmore_title1,
          knowmore_text: req.body.knowmore_text,
          knowmore_btn_text: req.body.knowmore_btn_text,
          knowmore_btn_url: req.body.knowmore_btn_url,
          knowmoreimage: knowmoreImagePath
        };
    
        // 6. Save to DB
        await collection.findOneAndUpdate(
          {},
          { $set: formData },
          { upsert: true }
        );
    
       
        req.flash('success', 'All changes have been applied.');
        res.redirect(`/admin/landingpage/${req.body.page}`);
    
      } catch (er) {
        console.log(er.message);
       
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


