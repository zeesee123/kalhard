const express=require('express');
const app=express();
const path=require('path');
const mongoose=require('mongoose');
const multer=require('multer');
const fs=require('fs');
const ObjectId = mongoose.Types.ObjectId;
const nodemailer=require('nodemailer');
//const expressListRoutes = require('express-list-routes');



const routes=require('./routes/web');

const Media=require('./models/Media');
const CareerApplication=require('./models/CareerApplication');

require('dotenv').config();
console.log(process.env.PORT);
// console.log('this is mongoose',mongoose);
mongoose.connect(process.env.CONNECTION_STRING,{dbName:process.env.DB_NAME}).then(() => {console.log('✅ MongoDB connected'); console.log('frontend url',process.env.FRONTEND_URL);})
.catch(err => console.error('❌ Connection failed', err));




//helper functions

//auth functions
function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  req.flash('error', 'You must be logged in');
  return res.redirect('/admin/login');
}

function isGuest(req, res, next) {
  if (req.session.userId) {
    return res.redirect('/admin'); // or dashboard
  }
  next();
}

//function for capitalizing the first letter 
function ucfirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')    // Remove special characters
    .replace(/\-\-+/g, '-');     // Replace multiple hyphens
}



const calculateReadTime = (content) => {
  const wordsPerMinute = 200; // or 250
  const text = content.trim();
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes;
};


  // ✅ Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, 'public','dist', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created:', uploadsDir);
  }

   const resumeDir = path.join(__dirname, 'public','dist', 'cv');
  if (!fs.existsSync(resumeDir)) {
    fs.mkdirSync(resumeDir, { recursive: true });
    console.log('Uploads directory created:', resumeDir);
  };

  // ✅ Ensure uploads directory exists
  const casestudyDir = path.join(__dirname, 'public','dist', 'casestudies');
  if (!fs.existsSync(casestudyDir)) {
    fs.mkdirSync(casestudyDir, { recursive: true });
    console.log('Uploads directory created:', casestudyDir);
  }


    // ✅ Ensure uploads directory exists
  const industryDir = path.join(__dirname, 'public','dist', 'industry_reports');
  
  if (!fs.existsSync(industryDir)) {
    fs.mkdirSync(industryDir, { recursive: true });
    console.log('Uploads directory created:', industryDir);
  }


  // ✅ Ensure uploads directory exists
  const blogDir = path.join(__dirname, 'public','dist', 'blogs');
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
    console.log('Uploads directory created:', blogDir);
  }

   // ✅ Ensure whitepapers directory exists
  const whitepaperDir = path.join(__dirname, 'public','dist', 'whitepapers');
  if (!fs.existsSync(whitepaperDir)) {
    fs.mkdirSync(whitepaperDir, { recursive: true });
    console.log('Uploads directory created:', whitepaperDir);
  }


  const webinarDir = path.join(__dirname, 'public','dist', 'webinars');
  if (!fs.existsSync(webinarDir)) {
    fs.mkdirSync(webinarDir, { recursive: true });
    console.log('Uploads directory created:', webinarDir);
  }


  const datasheetDir = path.join(__dirname, 'public','dist', 'datasheets');
  if (!fs.existsSync(datasheetDir)) {
    fs.mkdirSync(datasheetDir, { recursive: true });
    console.log('Uploads directory created:', datasheetDir);
  }


  // ✅ Ensure uploads directory exists
  const usecaseDir = path.join(__dirname, 'public','dist', 'usecases');
  if (!fs.existsSync(usecaseDir)) {
    fs.mkdirSync(usecaseDir, { recursive: true });
    console.log('Uploads directory created:', usecaseDir);
  }


  const authorDir=path.join(__dirname, 'public','dist', 'authors');
  if (!fs.existsSync(authorDir)) {
    fs.mkdirSync(authorDir, { recursive: true });
    console.log('Uploads directory created:', authorDir);
  }
//multer for file uploads
// Multer setup for file uploads
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, 'public/dist/uploads/');
//     },
//     filename: function (req, file, cb) {
//       const uniqueName = Date.now() + '-' + file.originalname;
//       cb(null, uniqueName);
//     }
//   });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'case_study') {
      cb(null, 'public/dist/casestudies/');
    } else if (file.fieldname === 'blog_image') {
      cb(null, 'public/dist/blogs/'); // <-- blog image goes here
    } else if (file.fieldname === 'white_paper') {
      cb(null, 'public/dist/whitepapers/'); // <-- blog image goes here
    }else if (file.fieldname === 'webinar') {
      cb(null, 'public/dist/webinars/'); // <-- blog image goes here
    }else if (file.fieldname === 'datasheet') {
      cb(null, 'public/dist/datasheets/'); // <-- blog image goes here
    }else if (file.fieldname === 'usecase') {
      cb(null, 'public/dist/usecases/'); // <-- blog image goes here
    }else if (file.fieldname === 'author_image') {
      cb(null, 'public/dist/authors/'); 
    }else if (file.fieldname === 'industry_report') {
      cb(null, 'public/dist/industry_reports/'); 
    }else if(file.fieldname==='resume'){

      cb(null, 'public/dist/cv/');
    }else{// <-- blog image goes here else {
      cb(null, 'public/dist/uploads/');
    }
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});


  const upload = multer({ storage });


  //stuff for media upload goes in here
  
  // ----------------- MEDIA LIBRARY SETUP -----------------
const mediaBaseDir = path.join(__dirname, 'public','dist','media'); // <-- main media folder
const mediaFolders = ['images', 'pdfs', 'docs', 'others'];

// Ensure media folders exist
mediaFolders.forEach(folder => {
  const dir = path.join(mediaBaseDir, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer storage for media library
const mediaStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'others';
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (['png','jpg','jpeg','gif','webp'].includes(ext)) folder = 'images';
    else if (['pdf'].includes(ext)) folder = 'pdfs';
    else if (['doc','docx','txt'].includes(ext)) folder = 'docs';
    cb(null, path.join(mediaBaseDir, folder));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

const mediaUpload = multer({ storage: mediaStorage });

  //media upload ends here


  const session = require('express-session');
const flash = require('connect-flash');

// app.use(session({
//   secret: 'someSecretKey', // keep this secure
//   resave: false,
//   saveUninitialized: true
// }));

app.use(session({
  secret: 'someSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: null // default for non-remember
  }
}));

//middleware just to prevent the user to view the pages again after logging out

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});


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

app.use('/admin/assets/tinymce', express.static(path.join(__dirname, 'node_modules/tinymce')));

app.get('/admin',isAuthenticated,(req,res)=>{

    res.render('dashboard');
});

// app.post('/admin/login', async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });

//   if (!user || !(await bcrypt.compare(password, user.password))) {
//     req.flash('error', 'Invalid credentials');
//     return res.redirect('/login');
//   }

//   req.session.userId = user._id; // store user session
//   req.flash('success', 'Logged in successfully');
//   res.redirect('/admin/home');
// });

app.post('/admin/login', async (req, res) => {
  const { email, password, remember } = req.body;
  const errors = {};

  if (!email) errors.email = 'Email is required';
  if (!password) errors.password = 'Password is required';

  if (Object.keys(errors).length) {
    req.flash('loginErrors', errors);
    req.flash('old', { email, remember });
    return res.redirect('/admin/login');
  }

  const user = await mongoose.connection.db.collection('users').findOne({ email });

  const bcrypt = require('bcrypt'); // if not already at top

  if (!user || !(await bcrypt.compare(password, user.password))) {
    req.flash('loginErrors', { email: 'Invalid email or password' });
    req.flash('old', { email, remember });
    return res.redirect('/admin/login');
  }

  req.session.userId = user._id;

  // Handle remember me
  if (remember) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  } else {
    req.session.cookie.expires = false;
  }

  req.flash('success', 'Logged in successfully');
  res.redirect('/admin');
});


app.post('/admin/logout',(req,res)=>{
  
    req.session.destroy(err => {
      if (err) {
        console.log('Logout failed', err);
        return res.redirect('/admin');
      }
      res.redirect('/admin/login');
    });
  
});


app.get('/admin/home',isAuthenticated,async(req,res)=>{

    const data = await mongoose.connection.db.collection('homepage').findOne({});
    console.log(data);
    res.render('homepage',{section:data||{}});
});


app.get('/admin/homenew',isAuthenticated,async(req,res)=>{

    const data = await mongoose.connection.db.collection('homepage').findOne({});
    console.log(data);
    res.render('homepagenew',{section:data||{}});
});

app.get('/admin/login',isGuest,(req,res)=>{
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

  app.get('/admin/table/:page/:entries',isAuthenticated,async(req,res)=>{


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


  app.get('/admin/get_blogs',isAuthenticated, async (req, res) => {
  try {

  //   const collection = mongoose.connection.db.collection(page);

  // try {
  //   const doc = await collection.findOne({ page });
    const blogs = await mongoose.connection.db.collection('blogs').aggregate([
      {
        $lookup: {
          from: 'authors',
          localField: 'author',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      {
        $unwind: {
          path: '$authorInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { date: -1 }
      }
    ]).toArray();

    const data = blogs.map((item, index) => ({
      id: index + 1,
      title: item.title || '',
      author: item.authorInfo?.name || 'Unknown',
      date: item.date ? new Date(item.date).toLocaleDateString() : '',
      image: item.image
        ? `<img src="/admin/assets/dist${item.image}" style="width: 100px; height: auto; object-fit: contain;">`
        : '',
      actions: `
        <a href="${process.env.FRONTEND_URL}/insights/blogs/${slugify(item.title)}" target="_blank" class="btn btn-primary mx-1">
          <i class="bi bi-eye-fill"></i> Preview
        </a>
        <a href="/admin/edit_blog/${item._id}" class="btn btn-success mx-1">
          <i class="bi bi-pencil-square"></i> Edit
        </a>
        <button type="button" class="btn btn-danger mx-1 btn-delete" data-id="${item._id}" data-type="blogs">
    <i class="bi bi-trash3-fill"></i> Delete
  </button>
      `
    }));

    res.status(200).json({ data });

  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


//routes for popup forms

app.get('/admin/popupmaker',(req,res)=>{

  res.render('popupmaker');
});

app.get('/admin/view_popupforms',(req,res)=>{

  res.render('view_popups');
});

app.get('/admin/view_usecases',(req,res)=>{

  res.render('view_usecases');
});


app.get('/admin/view_authors',(req,res)=>{

  res.render('view_authors');
});

app.get('/admin/popup_list',async(req,res)=>{

  try {
    const caseStudies = await mongoose.connection.db.collection('popups')
    .find({}).sort({ _id: -1 })
      .toArray();

      ///admin/case_study/:id
    const data = caseStudies.map((item, index) => ({
      id: index + 1,
      name: item.name || 'Untitled',
      selector: item.css_selector,
      actions: `
      
        <a href="/admin/edit_popup/${item._id}" class="btn btn-success mx-1">
          <i class="bi bi-pencil-square"></i> Edit
        </a>
        <button type="button" class="btn btn-danger mx-1 eradicator" data-id="${item._id}" data-type="landingpage">
          <i class="bi bi-trash3-fill"></i> Delete
        </button>
      `
    }));

    res.status(200).json({ data });
  } catch (err) {
    console.error('Error fetching popups:', err);
    res.status(500).json({ message: 'Server error' });
  }

});

app.post('/admin/edit_popup/:id',async(req,res)=>{
  // console.log('hitttt');
try {
    const { id } = req.params;
    const { title, css_selector, form_code } = req.body;

    // console.log(title,css_selector,form_code);
    // process.exit();
    if (!title || !css_selector || !form_code) {
      req.flash('error', 'All fields are required.');
      return res.redirect(`/admin/edit_popup/${id}`);
    }

    const collection = mongoose.connection.db.collection('popups');

    // Optional: Ensure CSS selector is unique except for the current popup
    const existing = await collection.findOne({ 
      css_selector, 
      _id: { $ne: new mongoose.Types.ObjectId(id) }
    });
    if (existing) {
      req.flash('error', 'A popup with this CSS selector already exists.');
      return res.redirect(`/admin/edit_popup/${id}`);
    }

    // Perform the update
    const result = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          name: title,
          css_selector,
          form_code,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      req.flash('error', 'Popup not found.');
      return res.redirect('/admin/popupmaker');
    }

    req.flash('success', 'Popup updated successfully.');
    res.redirect('/admin/edit_popup/'+id);

  } catch (err) {
    console.error('Error updating popup:', err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/admin/popupmaker');
  }

});

app.get('/admin/edit_popup/:id', async (req, res) => {
  
  const { id } = req.params;

  try {
    const popup = await mongoose.connection.db.collection('popups').findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (!popup) {
      return res.status(404).send('Popup not found');
    }

    // Render your HTML form here (assuming you're using a view engine like EJS/Pug)
    // But since you're doing HTML manually, let's send a basic HTML form directly:

    res.render('edit_popup',{popup});
   
  } catch (err) {
    console.error('Error fetching popup:', err);
    res.status(500).send('Server error');
  }
});



//landingpage tag filter pagewise

app.get('/api/landing-pages/by-tag/:tagId/:pageType', async (req, res) => {
  try {
    const { tagId, pageType } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({ error: 'Invalid tag ID' });
    }

    // Build query
    const query = {
      tag: new mongoose.Types.ObjectId(tagId),
      page: pageType // match landing page type
    };

    const landingPages = await mongoose.connection.db
      .collection('landingpage')
      .find(query, {
        projection: {
          _id: 1,
          featured_image: 1,
          hero_title1: 1,
          card_one: 1
        }
      })
      .toArray();

    res.json({ landingPages });
  } catch (err) {
    console.error('Error fetching landing pages by tag & type:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});




app.post('/admin/popup_add', upload.none(), async (req, res) => {
  try {
    const { title, css_selector, form_code } = req.body;

    if (!title || !css_selector || !form_code) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/admin/popupmaker');
    }

    const collection = mongoose.connection.db.collection('popups');

    // Check for existing popup with same CSS selector
    const existing = await collection.findOne({ css_selector });

    if (existing) {
      req.flash('error', 'A popup with this CSS selector already exists.');
      return res.redirect('/admin/popupmaker');
    }

    await collection.insertOne({
      name: title,
      css_selector,
      form_code,
      createdAt: new Date()
    });

    console.log({ title, css_selector, form_code });

    req.flash('success', 'Popup saved successfully.');
    res.redirect('/admin/popupmaker');

  } catch (err) {
    console.error('Error saving popup:', err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/admin/popupmaker');
  }
});


app.get('/admin/viewpopupforms',(req,res)=>{

res.render('viewpopupforms');

});




//rendering business cards

app.get('/admin/table/case_study/:id/business_cards',isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const collection = mongoose.connection.db.collection('landingpage');

    const doc = await collection.findOne({ _id: new mongoose.Types.ObjectId(id) });

    if (!doc) {
      return res.status(404).json({ message: 'Case study not found' });
    }

    const cards = doc.business_cards || [];

    const data = cards.map((card, index) => ({
      id: index + 1,
      title: card.number || '',
      content: card.content || '',
      image: card.image
        ? `<img src="/admin/assets/dist${card.image}" style="width: 100px; height: auto; object-fit: contain;">`
        : '',
      actions: `
        <button class="btn btn-success editer mx-1" data-id="${card.id}" data-type="casestudy_business_cards" type="button" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
          <i class="bi bi-pencil-square"></i> Edit
        </button>
        <button class="btn btn-danger eradicator mx-1" data-id="${card.id}" data-type="casestudy_business_cards" type="button" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
          <i class="bi bi-trash3-fill"></i> Delete
        </button>
      `
    }));

    res.status(200).json({ data });
  } catch (err) {
    console.error('Error fetching business cards:', err);
    res.status(500).json({ message: 'Server error' });
  }
});




app.get('/admin/get_casestudies',isAuthenticated, async (req, res) => {
  try {
    const caseStudies = await mongoose.connection.db.collection('landingpage')
      .find({ page: 'case_study' })
      .sort({ _id: -1 })
      .toArray();

      ///admin/case_study/:id
    const data = caseStudies.map((item, index) => ({
      id: index + 1,
      title: item.hero_title1 || 'Untitled',
      image: item.card_one
        ? `<img src="/admin/assets/dist${item.card_one}" style="width: 100px; height: auto; object-fit: contain;">`
        : '',
      actions: `
        <a href="${item.case_study}" target="_blank" class="btn btn-primary mx-1">
          <i class="bi bi-eye-fill"></i> Preview
        </a>
        <a href="/admin/edit_case_study/${item._id}" class="btn btn-success mx-1">
          <i class="bi bi-pencil-square"></i> Edit
        </a>
        <button type="button" class="btn btn-danger mx-1 eradicator" data-id="${item._id}" data-type="landingpage">
          <i class="bi bi-trash3-fill"></i> Delete
        </button>
      `
    }));

    res.status(200).json({ data });
  } catch (err) {
    console.error('Error fetching case studies:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/admin/get_authors',isAuthenticated,async(req,res)=>{

  try {
    const caseStudies = await mongoose.connection.db.collection('authors')
      .find({}).toArray(); //always use find in here dude 

      console.log(caseStudies);

      ///admin/case_study/:id
    const data = caseStudies.map((item, index) => ({
      id: index + 1,
      name: item.name || 'Untitled',
      // image: item.author_image
      //   ? `<img src="/admin/assets/dist${item.author_image}" style="width: 100px; height: auto; object-fit: contain;">`
      //   : '',
      actions: `
        <a href="/admin/edit_author/${item._id}" class="btn btn-success mx-1">
          <i class="bi bi-pencil-square"></i> Edit
        </a>
        <button type="button" class="btn btn-danger mx-1 eradicator" data-id="${item._id}" data-type="landingpage">
          <i class="bi bi-trash3-fill"></i> Delete
        </button>
      `
    }));

    res.status(200).json({ data });
  } catch (err) {
    console.error('Error fetching case studies:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/admin/get_usecases',isAuthenticated, async (req, res) => {
  try {
    const caseStudies = await mongoose.connection.db.collection('usecases')
      .find({}).toArray(); //always use find in here dude 

      console.log(caseStudies);

      ///admin/case_study/:id
    const data = caseStudies.map((item, index) => ({
      id: index + 1,
      title: item.title || 'Untitled',
      image: item.usecase_image
        ? `<img src="/admin/assets/dist${item.usecase_image}" style="width: 100px; height: auto; object-fit: contain;">`
        : '',
      actions: `
        <a href="${item.case_study}" target="_blank" class="btn btn-primary mx-1">
          <i class="bi bi-eye-fill"></i> Preview
        </a>
        <a href="/admin/edit_usecase/${item._id}" class="btn btn-success mx-1">
          <i class="bi bi-pencil-square"></i> Edit
        </a>
        <button type="button" class="btn btn-danger mx-1 eradicator" data-id="${item._id}" data-type="landingpage">
          <i class="bi bi-trash3-fill"></i> Delete
        </button>
      `
    }));

    res.status(200).json({ data });
  } catch (err) {
    console.error('Error fetching case studies:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



app.get('/admin/get_datasheets',isAuthenticated, async (req, res) => {
  try {
    const caseStudies = await mongoose.connection.db.collection('landingpage')
      .find({ page: 'datasheet' })
      .sort({ _id: -1 })
      .toArray();

      ///admin/case_study/:id
    const data = caseStudies.map((item, index) => ({
      id: index + 1,
      title: item.hero_title1 || 'Untitled',
      image: item.card_one
        ? `<img src="/admin/assets/dist${item.card_one}" style="width: 100px; height: auto; object-fit: contain;">`
        : '',
      actions: `
        <a href="${item.case_study}" target="_blank" class="btn btn-primary mx-1">
          <i class="bi bi-eye-fill"></i> Preview
        </a>
        <a href="/admin/edit_datasheet/${item._id}" class="btn btn-success mx-1">
          <i class="bi bi-pencil-square"></i> Edit
        </a>
        <button type="button" class="btn btn-danger mx-1 eradicator" data-id="${item._id}" data-type="landingpage">
          <i class="bi bi-trash3-fill"></i> Delete
        </button>
      `
    }));

    res.status(200).json({ data });
  } catch (err) {
    console.error('Error fetching case studies:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

//media upload
app.get('/admin/media',(req,res)=>{
  res.render('add_media');
});

app.get('/admin/media/list', async (req, res) => {
  const mediaFiles = await Media.find(); // Assuming your Media model
  // send URL and maybe type
  res.json(mediaFiles.map(m => ({
    url: m.url,
    type: m.type,
    name: m.name
  })));
});

//routes for media part come in here dude 

app.post('/admin/media/upload', isAuthenticated, mediaUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'No file uploaded');
      return res.redirect('/admin/media');
    }

    // Save metadata in MongoDB (assuming you have a Media model)
    // const Media = mongoose.model('Media', new mongoose.Schema({
    //   filename: String,
    //   originalName: String,
    //   folder: String,
    //   path: String,
    //   mimetype: String,
    //   size: Number,
    //   createdAt: { type: Date, default: Date.now }
    // }));

    // const ext = req.file.originalname.split('.').pop().toLowerCase();
    // let folder = 'others';
    // if (['png','jpg','jpeg','gif','webp'].includes(ext)) folder = 'images';
    // else if (['pdf'].includes(ext)) folder = 'pdfs';
    // else if (['doc','docx','txt'].includes(ext)) folder = 'docs';

    // const media = await Media.create({
    //   filename: req.file.filename,
    //   originalName: req.file.originalname,
    //   folder,
    //   path: `/media/${folder}/${req.file.filename}`,
    //   mimetype: req.file.mimetype,
    //   size: req.file.size
    // });

    const ext = req.file.originalname.split('.').pop().toLowerCase();
let folder = 'others';
let type = 'other';
if (['png','jpg','jpeg','gif','webp'].includes(ext)) { folder = 'images'; type='image'; }
else if (['pdf'].includes(ext)) { folder='pdfs'; type='pdf'; }
else if (['doc','docx','txt'].includes(ext)) { folder='docs'; type='doc'; }

const media = await Media.create({
  filename: req.file.filename,
  originalName: req.file.originalname,
  folder,
  path: `/media/${folder}/${req.file.filename}`,
  url: `/media/${folder}/${req.file.filename}`,
  mimetype: req.file.mimetype,
  size: req.file.size,
  type
});

    req.flash('success', 'File uploaded successfully');
    res.redirect('/admin/media');
  } catch (err) {
    console.error(err);

    req.flash('error', 'Something went wrong');
    res.redirect('/admin/media');
  }
});

// Get all media files
app.get('/admin/media_all', isAuthenticated, async (req, res) => {
  try {
    const Media = mongoose.model('Media');
    const files = await Media.find().sort({ createdAt: -1 });
    res.render('admin/media_library', { files, success: req.flash('success'), error: req.flash('error') });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to fetch media');
    res.redirect('/admin');
  }
});

// Delete a media file
app.post('/admin/media/delete/:id', isAuthenticated, async (req, res) => {
  try {
    const Media = mongoose.model('Media');
    const file = await Media.findById(req.params.id);
    if (!file) {
      req.flash('error', 'File not found');
      return res.redirect('/admin/media');
    }

    const filePath = path.join(__dirname, 'public', file.path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // delete from disk

    await Media.findByIdAndDelete(req.params.id); // delete from db

    req.flash('success', 'File deleted successfully');
    res.redirect('/admin/media');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to delete file');
    res.redirect('/admin/media');
  }
});

app.get('/api/landing-pages/by-tag/:tagId', async (req, res) => {
  try {
    const { tagId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({ error: 'Invalid tag ID' });
    }

    const landingPages = await mongoose.connection.db
      .collection('landingpage')
      .find(
        { tag: new mongoose.Types.ObjectId(tagId) }, // <-- add `new` here
        {
          projection: {
            _id: 1,
            featured_image: 1,
            hero_title1: 1,
            card_one: 1
          }
        }
      )
      .toArray();

    res.json({ landingPages });
  } catch (err) {
    console.error('Error fetching landing pages by tag:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});





app.get('/admin/get_whitepapers',isAuthenticated, async (req, res) => {
  try {
    const caseStudies = await mongoose.connection.db.collection('landingpage')
      .find({ page: 'white_paper' })
      .sort({ _id: -1 })
      .toArray();

      ///admin/case_study/:id
    const data = caseStudies.map((item, index) => ({
      id: index + 1,
      title: item.hero_title1 || 'Untitled',
      image: item.card_one
        ? `<img src="/admin/assets/dist${item.card_one}" style="width: 100px; height: auto; object-fit: contain;">`
        : '',
      actions: `
        <a href="${item.case_study}" target="_blank" class="btn btn-primary mx-1">
          <i class="bi bi-eye-fill"></i> Preview
        </a>
        <a href="/admin/edit_white_paper/${item._id}" class="btn btn-success mx-1">
          <i class="bi bi-pencil-square"></i> Edit
        </a>
        <button type="button" class="btn btn-danger mx-1 eradicator" data-id="${item._id}" data-type="landingpage">
          <i class="bi bi-trash3-fill"></i> Delete
        </button>
      `
    }));

    res.status(200).json({ data });
  } catch (err) {
    console.error('Error fetching white papers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


app.get('/admin/get_webinars',isAuthenticated, async (req, res) => {
  try {
    const caseStudies = await mongoose.connection.db.collection('landingpage')
      .find({ page: 'webinar' })
      .sort({ _id: -1 })
      .toArray();

      ///admin/case_study/:id
    const data = caseStudies.map((item, index) => ({
      id: index + 1,
      title: item.hero_title1 || 'Untitled',
      image: item.card_one
        ? `<img src="/admin/assets/dist${item.card_one}" style="width: 100px; height: auto; object-fit: contain;">`
        : '',
      actions: `
        <a href="${item.case_study}" target="_blank" class="btn btn-primary mx-1">
          <i class="bi bi-eye-fill"></i> Preview
        </a>
        <a href="/admin/edit_case_study/${item._id}" class="btn btn-success mx-1">
          <i class="bi bi-pencil-square"></i> Edit
        </a>
        <button type="button" class="btn btn-danger mx-1 eradicator" data-id="${item._id}" data-type="landingpage">
          <i class="bi bi-trash3-fill"></i> Delete
        </button>
      `
    }));

    res.status(200).json({ data });
  } catch (err) {
    console.error('Error fetching webinars:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


  app.post('/admin/add_author',upload.fields([
    { name: 'author_image', maxCount: 1 }]), async (req, res) => {
  try {
    const authorName = req.body.author?.trim();

    const cardoneimageFile = req.files?.author_image?.[0];
const newcardoneImagePath = cardoneimageFile ? '/authors/' + cardoneimageFile.filename : null;

    if (!authorName) {
      req.flash('error', 'Author name is required.');
      return res.redirect('/admin/add_author');
    }

    const collection = mongoose.connection.db.collection('authors');

    const existing = await collection.findOne({ name: authorName });
    if (existing) {
      req.flash('error', 'Author already exists.');
      return res.redirect('/admin/add_author');
    }

    await collection.insertOne({
      name: authorName,
      image:newcardoneImagePath,
      about:req.body.about_author,
      createdAt: new Date()
    });

    req.flash('success', 'Author added successfully!');
    res.redirect('/admin/add_author');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/admin/add_author');
  }
});


app.post('/admin/edit_author/:id', upload.fields([
  { name: 'author_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const authorId = req.params.id;
    const authorName = req.body.author?.trim();

    if (!authorId) {
      req.flash('error', 'Invalid author ID.');
      return res.redirect(`/admin/edit_author/${req.params.id}`);
    }

    if (!authorName) {
      req.flash('error', 'Author name is required.');
      return res.redirect(`/admin/edit_author/${req.params.id}`);
    }

    const collection = mongoose.connection.db.collection('authors');

    // check if author exists
    const existing = await collection.findOne({ _id: new mongoose.Types.ObjectId(authorId) });
    if (!existing) {
      req.flash('error', 'Author not found.');
      return res.redirect(`/admin/edit_author/${req.params.id}`);
    }

    // handle new image upload
    const cardoneimageFile = req.files?.author_image?.[0];
    let newcardoneImagePath = existing.image; // keep old one by default

    if (cardoneimageFile) {
      // delete old image if it exists
      if (existing.image) {
        const oldPath = path.join(__dirname, 'public', existing.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      newcardoneImagePath = '/authors/' + cardoneimageFile.filename;
    }

    // update document
    await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(authorId) },
      {
        $set: {
          name: authorName,
          image: newcardoneImagePath,
          about: req.body.about_author,
          updatedAt: new Date()
        }
      }
    );

    req.flash('success', 'Author updated successfully!');
    res.redirect(`/admin/edit_author/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect(`/admin/edit_author/${req.params.id}`);
  }
});


app.get('/admin/add_speakerhost',(req,res)=>{

  res.render('add_speakerhost');
})

app.post('/admin/add_speakerhost',upload.fields([
  { name: 'speaker_image', maxCount: 1 }]), async (req, res) => {
  try {
    const speakerName = req.body.speaker?.trim();

    if (!speakerName) {
      req.flash('error', 'Author name is required.');
      return res.redirect('/admin/add_speakerhost');
    }


    const heroimageFile = req.files?.speaker_image?.[0];
        const newHeroImagePath = heroimageFile ? '/uploads/' + heroimageFile.filename : null;

    const collection = mongoose.connection.db.collection('speakerhost');

    const existing = await collection.findOne({ name: speakerName });
    if (existing) {
      req.flash('error', 'Speaker/Host already exists.');
      return res.redirect('/admin/add_speakerhost');
    }

    await collection.insertOne({
      name: speakerName,
      designation:req.body.designation,
      image:newHeroImagePath,
      linkedin:req.body.linkedin,
      createdAt: new Date()
    });

    req.flash('success', 'Author added successfully!');
    res.redirect('/admin/add_speakerhost');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/admin/add_speakerhost');
  }
});

//route for the use case

app.get('/admin/add_usecase',async(req,res)=>{

  try{

    
    const tagCollection = mongoose.connection.db.collection('tags');
    const tags = await tagCollection.find({}).toArray();
    res.render('add_usecases',{tags,ucfirst});

  }catch(er){
    console.log(er);
  }
});


// app.get('/admin/edit_usecase',(req,res)=>{
//   res.render('edit_usecase');
// });

app.get('/admin/edit_usecase/:id', isAuthenticated, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const id = new ObjectId(req.params.id);

    // Fetch the usecase document
    const usecase = await db.collection('usecases').findOne({ _id: id });

    if (!usecase) {
      req.flash('error', 'Usecase not found');
      return res.redirect('/admin/dashboard');
    }

    // Fetch all tags to populate the select dropdown
    const tagCollection = db.collection('tags');
    const tags = await tagCollection.find({}).toArray();

    res.render('edit_usecase', {
      section: usecase,  // we'll use `section` in the template like your form
      tags,
      ucfirst
    });

  } catch (err) {
    console.error('Error loading usecase:', err);
    req.flash('error', 'Could not load usecase');
    res.redirect('/admin/dashboard');
  }
});

//routes for press release

// GET: render add_pressrelease form
app.get('/admin/add_pressrelease', isAuthenticated, async (req, res) => {
  try {
    const tagCollection = mongoose.connection.db.collection('tags');
    const tags = await tagCollection.find({}).toArray();

    res.render('add_pressrelease', { tags, ucfirst });
  } catch (err) {
    console.error('Error loading add_pressrelease form:', err);
    req.flash('error', 'Unable to load form');
    res.redirect('/admin/dashboard');
  }
});

// POST: save new press release
app.post('/admin/add_pressrelease', isAuthenticated, async (req, res) => {
  try {
    const pressReleaseCollection = mongoose.connection.db.collection('press_releases');

    // If you’re using multer for file upload
    const featured_image = req.file ? req.file.filename : null;

    // Grab submitted fields
    const { title, tags, content, embedded_url } = req.body;

    const newPressRelease = {
      title,
      content,
      embedded_url,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
      featured_image,
      createdAt: new Date()
    };

    await pressReleaseCollection.insertOne(newPressRelease);

    req.flash('success', 'Press Release added successfully');
    res.redirect('/admin/press_releases');
  } catch (err) {
    console.error('Error saving press release:', err);
    req.flash('error', 'Could not add press release');
    res.redirect('/admin/add_pressrelease');
  }
});


//edit author

app.get('/admin/edit_author/:id', isAuthenticated, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const id = new ObjectId(req.params.id);

    // Fetch the usecase document
    const usecase = await db.collection('authors').findOne({ _id: id });

    if (!usecase) {
      req.flash('error', 'Author not found');
      return res.redirect('/admin/dashboard');
    }

    // Fetch all tags to populate the select dropdown
    const tagCollection = db.collection('tags');
    const tags = await tagCollection.find({}).toArray();

    res.render('edit_author', {
      section: usecase,  // we'll use `section` in the template like your form
      tags,
      ucfirst
    });

  } catch (err) {
    console.error('Error loading usecase:', err);
    req.flash('error', 'Could not load usecase');
    res.redirect('/admin/dashboard');
  }
});



//use case post path

app.post('/admin/add_usecase', upload.fields([
  { name: 'usecase_image', maxCount: 1 },
  { name: 'usecase', maxCount: 1 }
]), async (req, res) => {
  try {
    const title = req.body.title?.trim();

    if (!title) {
      req.flash('error', 'Title is required.');
      return res.redirect('/admin/add_usecase');
    }

    // Featured image for usecase
    const usecaseImageFile = req.files?.usecase_image?.[0];
    const usecaseImagePath = usecaseImageFile ? '/uploads/' + usecaseImageFile.filename : null;

    // UseCase file
    const usecaseFile = req.files?.usecase?.[0];
    const usecasePath = usecaseFile ? '/usecases/' + usecaseFile.filename : null;

    const collection = mongoose.connection.db.collection('usecases');

    // Optional: check if a usecase with same title exists
    const existing = await collection.findOne({ title });
    if (existing) {
      req.flash('error', 'UseCase with this title already exists.');
      return res.redirect('/admin/add_usecase');
    }

    await collection.insertOne({
      title,
      tags: Array.isArray(req.body.tag)
        ? req.body.tag.map(t => new ObjectId(t))
        : req.body.tag
        ? [new ObjectId(req.body.tag)]
        : [],
      usecase_image: usecaseImagePath,
      usecase_file: usecasePath,
      hubspot_form:req.body.hubspot_form,

      createdAt: new Date()
    });

    req.flash('success', 'UseCase added successfully!');
    res.redirect('/admin/add_usecase');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/admin/add_usecase');
  }
});


//use case post thing 

app.post('/admin/edit_usecase/:id', upload.fields([
  { name: 'usecase_image', maxCount: 1 },
  { name: 'usecase', maxCount: 1 }
]), async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const collection = mongoose.connection.db.collection('usecases');

    const existing = await collection.findOne({ _id: id });
    if (!existing) {
      req.flash('error', 'UseCase not found.');
      return res.redirect('/admin/dashboard');
    }

    const title = req.body.title?.trim();
    if (!title) {
      req.flash('error', 'Title is required.');
      return res.redirect(`/admin/edit_usecase/${id}`);
    }

    // ========== File handling ==========
    // Featured Image
    let usecaseImagePath = existing.usecase_image;
    const usecaseImageFile = req.files?.usecase_image?.[0];
    if (usecaseImageFile) {
      // delete old image if it exists
      if (existing.usecase_image) {
        const oldImgPath = path.join(__dirname, 'public', existing.usecase_image);
        if (fs.existsSync(oldImgPath)) {
          fs.unlinkSync(oldImgPath);
        }
      }
      usecaseImagePath = '/uploads/' + usecaseImageFile.filename;
    }

    // UseCase File (PDF)
    let usecasePath = existing.usecase_file;
    const usecaseFile = req.files?.usecase?.[0];
    if (usecaseFile) {
      // delete old file if it exists
      if (existing.usecase_file) {
        const oldFilePath = path.join(__dirname, 'public', existing.usecase_file);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      usecasePath = '/usecases/' + usecaseFile.filename;
    }

    // ========== Update DB ==========
    await collection.updateOne(
      { _id: id },
      {
        $set: {
          title,
          tags: Array.isArray(req.body.tag)
            ? req.body.tag.map(t => new ObjectId(t))
            : req.body.tag
            ? [new ObjectId(req.body.tag)]
            : [],
          usecase_image: usecaseImagePath,
          usecase_file: usecasePath,
          hubspot_form: req.body.hubspot_form
        }
      }
    );

    req.flash('success', 'UseCase updated successfully!');
    res.redirect(`/admin/edit_usecase/${id}`);
  } catch (err) {
    console.error('Error editing usecase:', err);
    req.flash('error', 'Something went wrong while updating.');
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/create_category', async (req, res) => {
  try {
    console.log(req.body);
    console.log('hatt');
    const authorName = req.body.category?.trim();

    if (!authorName) {
      req.flash('error', 'Author name is required.');
      return res.redirect('/admin/create_category');
    }

    const collection = mongoose.connection.db.collection('categories');

    const existing = await collection.findOne({ name: authorName });
    if (existing) {
      req.flash('error', 'Author already exists.');
      return res.redirect('/admin/create_category');
    }

    await collection.insertOne({
      name: authorName,
      createdAt: new Date()
    });

    req.flash('success', 'Author added successfully!');
    res.redirect('/admin/create_category');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/admin/create_category');
  }
});


app.post('/admin/create_tags', async (req, res) => {
  try {
    console.log(req.body);
    console.log('hatt');
    const authorName = req.body.tag?.trim();

    if (!authorName) {
      req.flash('error', 'Tag name is required.');
      return res.redirect('/admin/create_tags');
    }

    const collection = mongoose.connection.db.collection('tags');

    const existing = await collection.findOne({ name: authorName });
    if (existing) {
      req.flash('error', 'Tag already exists.');
      return res.redirect('/admin/create_tags');
    }

    await collection.insertOne({
      name: authorName,
      createdAt: new Date()
    });

    req.flash('success', 'Tag added successfully!');
    res.redirect('/admin/create_tags');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/admin/create_tags');
  }
});

app.get('/admin/add_industry',(req,res)=>{


       res.render('add_industries');
})

app.post('/admin/add_industry', async (req, res) => {
  try {
    console.log(req.body);
    console.log('hatt');
    const authorName = req.body.industry?.trim();

    if (!authorName) {
      req.flash('error', 'Industry name is required.');
      return res.redirect('/admin/add_industry');
    }

    const collection = mongoose.connection.db.collection('industries');

    const existing = await collection.findOne({ name: authorName });
    if (existing) {
      req.flash('error', 'Tag already exists.');
      return res.redirect('/admin/add_industry');
    }

    await collection.insertOne({
      name: authorName,
      createdAt: new Date()
    });

    req.flash('success', 'Industry added successfully!');
    res.redirect('/admin/add_industry');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/admin/add_industry');
  }
});


//route for topics

app.get('/admin/add_topics',(req,res)=>{


  res.render('add_topics');
})

app.post('/admin/add_topics', async (req, res) => {
try {
console.log(req.body);
console.log('hatt');
const authorName = req.body.topic?.trim();

if (!authorName) {
 req.flash('error', 'Topic name is required.');
 return res.redirect('/admin/add_topics');
}

const collection = mongoose.connection.db.collection('topics');

const existing = await collection.findOne({ name: authorName });
if (existing) {
 req.flash('error', 'Topic already exists.');
 return res.redirect('/admin/add_topics');
}

await collection.insertOne({
 name: authorName,
 createdAt: new Date()
});

req.flash('success', 'Topic added successfully!');
res.redirect('/admin/add_topics');
} catch (err) {
console.error(err);
req.flash('error', 'Something went wrong');
res.redirect('/admin/add_topics');
}
});

//routes end

app.post('/admin/blog/create', upload.single('blog_image'), async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      author,
      date,
      publish,
      meta_title,
      slug,
      tag,
      meta_description,
      schema_markup
    } = req.body;

    // Blog image path (inside /public/dist/blogs)
    const blogImage = req.file ? '/blogs/' + req.file.filename : null;

    const collection = mongoose.connection.db.collection('blogs');

    const blogData = {
  title: title?.trim() || 'Untitled Blog',
  content: content?.trim() || '',
  category: category ? new ObjectId(category) : null,
  author: author ? new ObjectId(author) : null,
  image: blogImage,
  date: date ? new Date(date) : new Date(),
  publish: publish === 'on',
  read_time:calculateReadTime(content),

  tag: Array.isArray(tag)
    ? tag.map(t => new ObjectId(t))         // if multiple tags
    : tag
    ? [new ObjectId(tag)]                  // if only one tag selected
    : [],

  meta: {
    title: meta_title?.trim() || '',
    slug: slug?.trim() || '',
    description: meta_description?.trim() || '',
    schema: schema_markup?.trim() || ''
  },
  createdAt: new Date()
};

    await collection.insertOne(blogData);

    req.flash('success', 'Blog post added successfully!');
    res.redirect('/admin/add_blog');
  } catch (err) {
    console.error('Error adding blog:', err);
    req.flash('error', 'Something went wrong');
    res.redirect('/admin/add_blog');
  }
});


  app.get('/admin/landingpage/:page',isAuthenticated,async(req,res)=>{

    // const data = await mongoose.connection.db.collection('landingpage').findOne({page:req.params.page});
    // console.log(data);
    
    const tagCollection = mongoose.connection.db.collection('tags');
    const tags = await tagCollection.find({}).toArray();
    // res.render('landingpage',{section:data||{},page:req.params.page,ucfirst});
    if(req.params.page=='webinar'){

      const speakerCollection = mongoose.connection.db.collection('speakerhost');
    const speakers = await speakerCollection.find({}).toArray();
    
      res.render('webinar',{page:req.params.page,ucfirst,tags,speakers});
    
    }else if(req.params.page=='datasheet'){

      res.render('datasheet',{page:req.params.page,ucfirst,tags});

    }else{

      res.render('landingpage',{page:req.params.page,ucfirst,tags});
    }
    
  });


  //case study edit

  app.get('/admin/edit_case_study/:id',isAuthenticated, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const id = new ObjectId(req.params.id);

    const section = await db.collection('landingpage').findOne({
      _id: id,
      page: 'case_study' // hardcoded page type
    });

    if (!section) {
      req.flash('error', 'Case Study not found');
      return res.redirect('/admin/dashboard');
    }

     const tagCollection = mongoose.connection.db.collection('tags');

    

        const tags = await tagCollection.find({}).toArray();
    res.render('edit_casestudy', {
      section,
      page: 'case_study',tags,
      ucfirst
    });
  } catch (err) {
    console.error('Error loading case study:', err);
    req.flash('error', 'Could not load case study');
    res.redirect('/admin/dashboard');
  }
});




app.post('/admin/edit_case_study/:id', upload.fields([
  { name: 'hero_image', maxCount: 1 },
  { name: 'knowmore_image', maxCount: 1 },
  { name: 'card_one', maxCount: 1 },
  { name: 'card_two', maxCount: 1 },
  { name: 'businessinvalue_img' },
  { name: 'case_study', maxCount: 1 },
  { name: 'featured_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('landingpage');
    const id = new ObjectId(req.params.id);
    const existingDoc = await collection.findOne({ _id: id, page: 'case_study' });

    if (!existingDoc) {
      req.flash('error', 'Case Study not found');
      return res.redirect('/admin/dashboard');
    }

    const heroimageFile = req.files?.hero_image?.[0];
    const newHeroImagePath = heroimageFile
      ? '/uploads/' + heroimageFile.filename
      : existingDoc.hero_image;

    const cardoneimageFile = req.files?.card_one?.[0];
    const newcardoneImagePath = cardoneimageFile
      ? '/uploads/' + cardoneimageFile.filename
      : existingDoc.card_one;

    const cardtwoimageFile = req.files?.card_two?.[0];
    const newcardtwoImagePath = cardtwoimageFile
      ? '/uploads/' + cardtwoimageFile.filename
      : existingDoc.card_two;

    const knowmoreImageFile = req.files?.knowmore_image?.[0];
    const knowmoreImagePath = knowmoreImageFile
      ? '/uploads/' + knowmoreImageFile.filename
      : existingDoc.knowmoreimage;

    const caseStudyFile = req.files?.case_study?.[0];
    const caseStudyPath = caseStudyFile
      ? '/casestudies/' + caseStudyFile.filename
      : existingDoc.case_study;

    const featuredImageFile = req.files?.featured_image?.[0];
    const featured_image = featuredImageFile
      ? '/uploads/' + featuredImageFile.filename
      : existingDoc.featured_image;

      const tag=req.body.tag;

    const updatedData = {
      page: req.body.page || "case_study",

      // Hero section
      hero_title1: req.body.hero_title1,
      hero_title2: req.body.hero_title2,
      hero_content: req.body.hero_content,
      hero_image: newHeroImagePath,
      card_one: newcardoneImagePath,
      card_two: newcardtwoImagePath,
      case_study: caseStudyPath,
      featured_image: featured_image,
      herobtn_text: req.body.herobtn_text,
      herobtn_url: req.body.herobtn_url,

      // Calsoft in focus
      calsoftinfocus_title: req.body.calsoftinfocus_title,
      calsoftinfocus_checkboxtext: req.body.calsoftinfocus_checkboxtext,
      calsoftinfocus_text: req.body.calsoftinfocus_text,
      hubspot_form: req.body.hubspot_form,

        tag: Array.isArray(tag)
    ? tag.map(t => new ObjectId(t))         // if multiple tags
    : tag
    ? [new ObjectId(tag)]                  // if only one tag selected
    : [],

      // Know more section
      knowmore_title1: req.body.knowmore_title1,
      knowmore_text: req.body.knowmore_text,
      knowmore_btn_text: req.body.knowmore_btn_text,
      knowmore_btn_url: req.body.knowmore_btn_url,
      knowmoreimage: knowmoreImagePath,


      // SEO section
      meta: {
        title: req.body.meta_title?.trim() || '',
        description: req.body.meta_description?.trim() || '',
        schema: req.body.schema_markup?.trim() || '',
        slug:req.body.slug?.trim()||'',
      }
    };

    await collection.updateOne(
      { _id: id },
      { $set: updatedData }
    );

    req.flash('success', 'Case Study updated successfully.');
    res.redirect(`/admin/landingpage/${req.body.page}`);
  } catch (err) {
    console.error('Update error:', err.message);
    req.flash('error', 'Something went wrong while updating.');
    res.redirect(`/admin/landingpage/${req.body.page}`);
  }
});

//edit white paper get

//edit white paper post 

app.get('/admin/edit_white_paper/:id',isAuthenticated, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const id = new ObjectId(req.params.id);

    const section = await db.collection('landingpage').findOne({
      _id: id,
      page: 'white_paper' // hardcoded page type
    });

    if (!section) {
      req.flash('error', 'White paper not found');
      return res.redirect('/admin/dashboard');
    }

     const tagCollection = mongoose.connection.db.collection('tags');

    

        const tags = await tagCollection.find({}).toArray();
    res.render('edit_whitepaper', {
      section,
      page: 'white_paper',tags,
      ucfirst
    });
  } catch (err) {
    console.error('Error loading case study:', err);
    req.flash('error', 'Could not load case study');
    res.redirect('/admin/dashboard');
  }
});

//edit datasheet

app.get('/admin/edit_datasheet/:id',isAuthenticated, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const id = new ObjectId(req.params.id);

    const section = await db.collection('landingpage').findOne({
      _id: id,
      page: 'datasheet' // hardcoded page type
    });

    if (!section) {
      req.flash('error', 'Case Study not found');
      return res.redirect('/admin/dashboard');
    }

     const tagCollection = mongoose.connection.db.collection('tags');

    

        const tags = await tagCollection.find({}).toArray();
    res.render('edit_datasheet', {
      section,
      page: 'datasheet',tags,
      ucfirst
    });
  } catch (err) {
    console.error('Error loading case study:', err);
    req.flash('error', 'Could not load case study');
    res.redirect('/admin');
  }
});



app.post('/admin/edit_datasheet/:id', upload.fields([
  { name: 'hero_image', maxCount: 1 },
  { name: 'knowmore_image', maxCount: 1 },
  { name: 'card_one', maxCount: 1 },
  { name: 'card_two', maxCount: 1 },
  { name: 'businessinvalue_img' },
  { name: 'datasheet', maxCount: 1 },
  { name: 'featured_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('landingpage');
    const id = new ObjectId(req.params.id);
    const existingDoc = await collection.findOne({ _id: id, page: 'datasheet' });

    if (!existingDoc) {
      req.flash('error', 'Datasheet not found');
      return res.redirect('/admin/dashboard');
    }


    //business cards start

    const businessCards = [...(existingDoc.business_cards || [])]; // start with existing cards

const businessTitles = req.body.businessinvalue_stitle || [];
const businessContents = req.body.businessinvalue_scontent || [];
const businessImages = req.files?.businessinvalue_img || [];

let currentCounter = businessCards.length > 0 
    ? Math.max(...businessCards.map(c => parseInt(c.id))) + 1 
    : 1;

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


    //business cards end

    const heroimageFile = req.files?.hero_image?.[0];
    const newHeroImagePath = heroimageFile
      ? '/uploads/' + heroimageFile.filename
      : existingDoc.hero_image;

    const cardoneimageFile = req.files?.card_one?.[0];
    const newcardoneImagePath = cardoneimageFile
      ? '/uploads/' + cardoneimageFile.filename
      : existingDoc.card_one;

    const cardtwoimageFile = req.files?.card_two?.[0];
    const newcardtwoImagePath = cardtwoimageFile
      ? '/uploads/' + cardtwoimageFile.filename
      : existingDoc.card_two;

    const knowmoreImageFile = req.files?.knowmore_image?.[0];
    const knowmoreImagePath = knowmoreImageFile
      ? '/uploads/' + knowmoreImageFile.filename
      : existingDoc.knowmoreimage;

    const caseStudyFile = req.files?.datasheet?.[0];
    const caseStudyPath = caseStudyFile
      ? '/datasheets/' + caseStudyFile.filename
      : existingDoc.case_study;

    const featuredImageFile = req.files?.featured_image?.[0];
    const featured_image = featuredImageFile
      ? '/uploads/' + featuredImageFile.filename
      : existingDoc.featured_image;

      const tag=req.body.tag;

    const updatedData = {
      page: req.body.page || "datasheet",

      // Hero section
      hero_title1: req.body.hero_title1,
      hero_title2: req.body.hero_title2,
      hero_content: req.body.hero_content,
      hero_image: newHeroImagePath,
      card_one: newcardoneImagePath,
      card_two: newcardtwoImagePath,
      datasheet: caseStudyPath,
      featured_image: featured_image,
      herobtn_text: req.body.herobtn_text,
      herobtn_url: req.body.herobtn_url,
      businessinvalue_title:req.body.businessinvalue_title,

      business_cards: businessCards,

      // Calsoft in focus
      calsoftinfocus_title: req.body.calsoftinfocus_title,
      calsoftinfocus_checkboxtext: req.body.calsoftinfocus_checkboxtext,
      calsoftinfocus_text: req.body.calsoftinfocus_text,
      hubspot_form: req.body.hubspot_form,

        tag: Array.isArray(tag)
    ? tag.map(t => new ObjectId(t))         // if multiple tags
    : tag
    ? [new ObjectId(tag)]                  // if only one tag selected
    : [],

      // Know more section
      knowmore_title1: req.body.knowmore_title1,
      knowmore_text: req.body.knowmore_text,
      knowmore_btn_text: req.body.knowmore_btn_text,
      knowmore_btn_url: req.body.knowmore_btn_url,
      knowmoreimage: knowmoreImagePath,


      // SEO section
      meta: {
        title: req.body.meta_title?.trim() || '',
        description: req.body.meta_description?.trim() || '',
        schema: req.body.schema_markup?.trim() || '',
        slug:req.body.slug?.trim()||'',
      }
    };

    await collection.updateOne(
      { _id: id },
      { $set: updatedData }
    );

    req.flash('success', 'Datasheet updated successfully.');
    res.redirect(`/admin/edit_datasheet/${req.params.id}`);
  } catch (err) {
    console.error('Update error:', err.message);
    req.flash('error', 'Something went wrong while updating.');
    res.redirect(`/admin/landingpage/${req.params.id}`);
  }
});


// app.post('/admin/edit_white_paper/:id', upload.fields([
//   { name: 'hero_image', maxCount: 1 },
//   { name: 'knowmore_image', maxCount: 1 },
//   { name: 'card_one', maxCount: 1 },
//   { name: 'card_two', maxCount: 1 },
//   { name: 'businessinvalue_img' },
//   { name: 'white_paper', maxCount: 1 },
//   { name: 'featured_image', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const collection = mongoose.connection.db.collection('landingpage');
//     const id = new ObjectId(req.params.id);

//     // 🛠️ Correct page name
//     const existingDoc = await collection.findOne({ _id: id, page: 'white_paper' });

//     if (!existingDoc) {
//       req.flash('error', 'White paper not found');
//       return res.redirect('/admin/dashboard');
//     }

//     // 📸 Handle all image fields
//     const heroimageFile = req.files?.hero_image?.[0];
//     const newHeroImagePath = heroimageFile ? '/uploads/' + heroimageFile.filename : existingDoc.hero_image;

//     const cardoneimageFile = req.files?.card_one?.[0];
//     const newcardoneImagePath = cardoneimageFile ? '/uploads/' + cardoneimageFile.filename : existingDoc.card_one;

//     const cardtwoimageFile = req.files?.card_two?.[0];
//     const newcardtwoImagePath = cardtwoimageFile ? '/uploads/' + cardtwoimageFile.filename : existingDoc.card_two;

//     const knowmoreImageFile = req.files?.knowmore_image?.[0];
//     const knowmoreImagePath = knowmoreImageFile ? '/uploads/' + knowmoreImageFile.filename : existingDoc.knowmoreimage;

//     const whitePaperFile = req.files?.white_paper?.[0];
//     const whitePaperPath = whitePaperFile ? '/whitepapers/' + whitePaperFile.filename : existingDoc.white_paper;

//     const featuredImageFile = req.files?.featured_image?.[0];
//     const featured_image = featuredImageFile ? '/uploads/' + featuredImageFile.filename : existingDoc.featured_image;

//     const tag = req.body.tag;

//     // 🧠 Business value section
//     // let businessCards = [];
//     // const businessTitles = req.body.businessinvalue_stitle || [];
//     // const businessContents = req.body.businessinvalue_scontent || [];
//     // const businessImages = req.files?.businessinvalue_img || [];

//     // for (let i = 0; i < businessTitles.length; i++) {
//     //   if (!businessTitles[i] && !businessContents[i] && !businessImages[i]) continue;

//     //   businessCards.push({
//     //     id: (i + 1).toString(),
//     //     number: businessTitles[i],
//     //     content: businessContents[i],
//     //     image: businessImages[i] ? '/uploads/' + businessImages[i].filename : (existingDoc.business_cards?.[i]?.image || null)
//     //   });
//     // }

//     const updatedData = {
//       page: 'white_paper',

//       // Hero section
//       hero_title1: req.body.hero_title1,
//       hero_title2: req.body.hero_title2,
//       hero_content: req.body.hero_content,
//       hero_image: newHeroImagePath,
//       card_one: newcardoneImagePath,
//       card_two: newcardtwoImagePath,
//       white_paper: whitePaperPath,
//       featured_image: featured_image,
//       herobtn_text: req.body.herobtn_text,
//       herobtn_url: req.body.herobtn_url,

//       // Calsoft in focus
//       calsoftinfocus_title: req.body.calsoftinfocus_title,
//       calsoftinfocus_checkboxtext: req.body.calsoftinfocus_checkboxtext,
//       calsoftinfocus_text: req.body.calsoftinfocus_text,
//       hubspot_form: req.body.hubspot_form,

//       tag: Array.isArray(tag)
//         ? tag.map(t => new ObjectId(t))
//         : tag
//           ? [new ObjectId(tag)]
//           : [],

//       // Know more section
//       knowmore_title1: req.body.knowmore_title1,
//       knowmore_text: req.body.knowmore_text,
//       knowmore_btn_text: req.body.knowmore_btn_text,
//       knowmore_btn_url: req.body.knowmore_btn_url,
//       knowmoreimage: knowmoreImagePath,

//       // Business Value Section
//       // business_cards: businessCards,
//       whyread_text:req.body.whyread_text,

//       // SEO section
//       meta: {
//         title: req.body.meta_title?.trim() || '',
//         description: req.body.meta_description?.trim() || '',
//         schema: req.body.schema_markup?.trim() || ''
//       }
//     };

//     await collection.updateOne(
//       { _id: id },
//       { $set: updatedData }
//     );

//     req.flash('success', 'White Paper updated successfully.');
//     res.redirect(`/admin/landingpage/${updatedData.page}`);
//   } catch (err) {
//     console.error('Update error:', err.message);
//     req.flash('error', 'Something went wrong while updating.');
//     res.redirect(`/admin/landingpage/${req.body.page}`);
//   }
// });
app.post("/admin/edit_white_paper/:id", upload.fields([
  { name: "hero_image", maxCount: 1 },
  { name: "card_one", maxCount: 1 },
  { name: "card_two", maxCount: 1 },
  { name: "featured_image", maxCount: 1 },
  { name: "knowmore_image", maxCount: 1 },
  { name: "white_paper", maxCount: 1 }
]), async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const collection = mongoose.connection.db.collection('landingpage');
    const existingDoc = await collection.findOne({ _id: id, page: 'white_paper' });

    //     const collection = mongoose.connection.db.collection('landingpage');
//     const id = new ObjectId(req.params.id);

//     // 🛠️ Correct page name
//     const existingDoc = await collection.findOne({ _id: id, page: 'white_paper' });


    if (!existingDoc) {
      return res.status(404).json({ success: false, message: "Whitepaper not found" });
    }

    // Helper to delete old files
    const deleteOldFile = (relativePath) => {
      const fullPath = path.join(__dirname, 'public', 'dist', relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    };

    // Extract uploaded files
    const uploaded = req.files || {};

    const getUpdatedPath = (field, prefix = '/uploads/') => {
      const file = uploaded?.[field]?.[0];
      if (file) {
        if (existingDoc[field]) deleteOldFile(existingDoc[field]);
        return prefix + file.filename;
      } else {
        return existingDoc[field];
      }
    };

    // Build new file paths
    const heroImagePath = getUpdatedPath('hero_image');
    const cardOnePath = getUpdatedPath('card_one');
    const cardTwoPath = getUpdatedPath('card_two');
    const featuredImagePath = getUpdatedPath('featured_image');
    const knowMoreImagePath = getUpdatedPath('knowmore_image');
    const whitePaperPath = getUpdatedPath('white_paper', '/whitepapers/');

    // Build update data
    const tag = req.body.tag;

    const updatedData = {
      page: req.body.page || "homepage",

      // Hero section
      hero_title1: req.body.hero_title1,
      hero_title2: req.body.hero_title2,
      hero_content: req.body.hero_content,
      hero_image: heroImagePath,
      card_one: cardOnePath,
      card_two: cardTwoPath,
      white_paper: whitePaperPath,
      featured_image: featuredImagePath,
      herobtn_text: req.body.herobtn_text,
      herobtn_url: req.body.herobtn_url,

      // Calsoft in focus
      calsoftinfocus_title: req.body.calsoftinfocus_title,
      calsoftinfocus_checkboxtext: req.body.calsoftinfocus_checkboxtext,
      calsoftinfocus_text: req.body.calsoftinfocus_text,
      hubspot_form: req.body.hubspot_form,

      // Business value section
      businessinvalue_title: req.body.businessinvalue_title,
      // ❌ REMOVED business_cards

      // Know more section
      knowmore_title1: req.body.knowmore_title1,
      knowmore_text: req.body.knowmore_text,
      knowmore_btn_text: req.body.knowmore_btn_text,
      knowmore_btn_url: req.body.knowmore_btn_url,
      knowmoreimage: knowMoreImagePath,

      // SEO
      meta: {
        title: req.body.meta_title?.trim() || '',
        description: req.body.meta_description?.trim() || '',
        schema: req.body.schema_markup?.trim() || ''
      },

      // Tags
      tag: Array.isArray(tag)
        ? tag.map(t => new ObjectId(t))
        : tag
        ? [new ObjectId(tag)]
        : [],

      updated_at: new Date()
    };

    // Update document
    await collection.updateOne({ _id: id }, { $set: updatedData });

    req.flash('success', 'White Paper updated successfully.');
    res.redirect(`/admin/edit_white_paper/${req.params.id}`);

  } catch (err) {
    console.error("Error updating white paper:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

//routes for video

app.get('/admin/add_video',(req,res)=>{

  res.render('add_video');

});

app.post('/admin/add_video', upload.fields([
  { name: 'video_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const youtubeScript = req.body.youtube_script?.trim();

    if (!title || !youtubeScript) {
      req.flash('error', 'Title and YouTube embed script are required.');
      return res.redirect('/admin/add_video');
    }

    // Featured image
    const videoImageFile = req.files?.video_image?.[0];
    const videoImagePath = videoImageFile ? '/uploads/' + videoImageFile.filename : null;

    const collection = mongoose.connection.db.collection('videos');

    // Check duplicates
    const existing = await collection.findOne({ title });
    if (existing) {
      req.flash('error', 'Video with this title already exists.');
      return res.redirect('/admin/add_video');
    }

    await collection.insertOne({
      title,
      youtube_script: youtubeScript,
      video_image: videoImagePath,
      createdAt: new Date()
    });

    req.flash('success', 'Video added successfully!');
    res.redirect('/admin/add_video');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/admin/add_video');
  }
});



//routes for podcasts

app.get('/admin/add_podcast', async (req, res) => {
  try {
    const speakerCollection = mongoose.connection.db.collection('speakerhost');
    const speakers = await speakerCollection.find({}).toArray();

    res.render('add_podcast', { speakers, ucfirst });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load podcast form');
    res.redirect('/admin');
  }
});


app.post('/admin/add_podcast', upload.fields([
  { name: 'podcast_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const url = req.body.url?.trim();
    const content = req.body.content?.trim();

    if (!title || !url) {
      req.flash('error', 'Title and URL are required.');
      return res.redirect('/admin/add_podcast');
    }

    // Featured image
    const podcastImageFile = req.files?.podcast_image?.[0];
    const podcastImagePath = podcastImageFile ? '/uploads/' + podcastImageFile.filename : null;

    const collection = mongoose.connection.db.collection('podcasts');

    // Check duplicates
    const existing = await collection.findOne({ title });
    if (existing) {
      req.flash('error', 'Podcast with this title already exists.');
      return res.redirect('/admin/add_podcast');
    }

    // Handle speakers (same style as webinars)
    const speakers = req.body.speakers;
    const speakersArr = Array.isArray(speakers)
      ? speakers.map(t => new ObjectId(t))
      : speakers
      ? [new ObjectId(speakers)]
      : [];

    await collection.insertOne({
      title,
      url,
      content,
      podcast_image: podcastImagePath,
      speakers: speakersArr,
      createdAt: new Date()
    });

    req.flash('success', 'Podcast added successfully!');
    res.redirect('/admin/add_podcast');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/admin/add_podcast');
  }
});

//podcast edit routes

app.get('/admin/edit_podcast/:id', isAuthenticated, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const id = new ObjectId(req.params.id);

    // Fetch the podcast document
    const podcast = await db.collection('podcasts').findOne({ _id: id });
    if (!podcast) {
      req.flash('error', 'Podcast not found');
      return res.redirect('/admin/dashboard');
    }

    // Fetch all speakers for the select dropdown
    const speakerCollection = db.collection('speakers');
    const speakers = await speakerCollection.find({}).toArray();

    res.render('edit_podcast', {
      podcast,   // use `podcast` in template like your form
      speakers,
      ucfirst
    });

  } catch (err) {
    console.error('Error loading podcast:', err);
    req.flash('error', 'Could not load podcast');
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/edit_podcast/:id', upload.fields([
  { name: 'podcast_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const collection = mongoose.connection.db.collection('podcasts');

    const existing = await collection.findOne({ _id: id });
    if (!existing) {
      req.flash('error', 'Podcast not found.');
      return res.redirect('/admin/dashboard');
    }

    const title = req.body.title?.trim();
    const url = req.body.url?.trim();
    const content = req.body.content?.trim();

    if (!title || !url) {
      req.flash('error', 'Title and URL are required.');
      return res.redirect(`/admin/edit_podcast/${id}`);
    }

    // ========== File handling ==========
    // Podcast Image
    let podcastImagePath = existing.podcast_image;
    const podcastImageFile = req.files?.podcast_image?.[0];
    if (podcastImageFile) {
      // delete old image if exists
      if (existing.podcast_image) {
        const oldImgPath = path.join(__dirname, 'public', existing.podcast_image);
        if (fs.existsSync(oldImgPath)) fs.unlinkSync(oldImgPath);
      }
      podcastImagePath = '/uploads/' + podcastImageFile.filename;
    }

    // ========== Speakers Handling ==========
    const speakers = req.body.speakers;
    const speakersArr = Array.isArray(speakers)
      ? speakers.map(t => new ObjectId(t))
      : speakers
      ? [new ObjectId(speakers)]
      : [];

    // ========== Update DB ==========
    await collection.updateOne(
      { _id: id },
      {
        $set: {
          title,
          url,
          content,
          podcast_image: podcastImagePath,
          speakers: speakersArr
        }
      }
    );

    req.flash('success', 'Podcast updated successfully!');
    res.redirect(`/admin/edit_podcast/${id}`);
  } catch (err) {
    console.error('Error editing podcast:', err);
    req.flash('error', 'Something went wrong while updating.');
    res.redirect('/admin/dashboard');
  }
});

app.get('/admin/view_podcasts',(req,res)=>{

  res.render('view_podcasts');
});

app.get('/admin/get_podcasts',async(req,res)=>{
  try {
    const caseStudies = await mongoose.connection.db.collection('podcasts')
      .find({}).toArray(); //always use find in here dude 

      console.log(caseStudies);

      ///admin/case_study/:id
    const data = caseStudies.map((item, index) => ({
      id: index + 1,
      title: item.title || 'Untitled',
      image: item.usecase_image
        ? `<img src="/admin/assets/dist${item.usecase_image}" style="width: 100px; height: auto; object-fit: contain;">`
        : '',
      actions: `
        <a href="${item.case_study}" target="_blank" class="btn btn-primary mx-1">
          <i class="bi bi-eye-fill"></i> Preview
        </a>
        <a href="/admin/edit_usecase/${item._id}" class="btn btn-success mx-1">
          <i class="bi bi-pencil-square"></i> Edit
        </a>
        <button type="button" class="btn btn-danger mx-1 eradicator" data-id="${item._id}" data-type="landingpage">
          <i class="bi bi-trash3-fill"></i> Delete
        </button>
      `
    }));

    res.status(200).json({ data });
  } catch (err) {
    console.error('Error fetching case studies:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



//workshop page

//case study individual

app.get('/admin/get_resource/casestudy_business_cards/:docId/:cardId',isAuthenticated, async (req, res) => {
  try {
    const { docId, cardId } = req.params;

    // const doc = await mongoose.connection.db.collection('landingpage').findOne({
    //   _id: new mongoose.Types.ObjectId(docId),
    //   page: 'case_study',
    // });

    const doc = await mongoose.connection.db.collection('landingpage').findOne({
      _id: new mongoose.Types.ObjectId(docId),
    
    });

    if (!doc) {
      return res.status(404).json({ message: 'Case study not found' });
    }

    const card = doc.business_cards?.find(card => card.id === cardId);

    if (!card) {
      return res.status(404).json({ message: 'Business card not found' });
    }

    res.status(200).json({ card });
  } catch (err) {
    console.error('Error fetching single business card:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


//add blog 

  app.get('/admin/add_blog',isAuthenticated,async(req,res)=>{

   try {
    const authorCollection = mongoose.connection.db.collection('authors');
    const categoryCollection = mongoose.connection.db.collection('categories');
    const tagCollection = mongoose.connection.db.collection('tags');
    const industryCollection=mongoose.connection.db.collection('industries');
    const topicCollection=mongoose.connection.db.collection('topics');

    const authors = await authorCollection.find({}).toArray();
    const categories = await categoryCollection.find({}).toArray();

        const tags = await tagCollection.find({}).toArray();
        const industries=await industryCollection.find({}).toArray();
        const topics=await topicCollection.find({}).toArray();
    console.log(topics);

    res.render('add_blog', {
      authors,
      categories,
      tags,
      topics,
      industries,
      ucfirst
    });
  } catch (err) {
    console.error('Error loading authors/categories/tags:', err);
    req.flash('error', 'Could not load blog form');
    res.redirect('/admin/dashboard'); // fallback
  }
  });


  app.get('/admin/edit_blog/:id',isAuthenticated, async (req, res) => {
  try {
    const blogId = new ObjectId(req.params.id);
    const db = mongoose.connection.db;

    const [blog, authors, categories, tags,industries,topics] = await Promise.all([
      db.collection('blogs').findOne({ _id: blogId }),
      db.collection('authors').find({}).toArray(),
      db.collection('categories').find({}).toArray(),
      db.collection('tags').find({}).toArray(),
      db.collection('industries').find({}).toArray(),
      db.collection('topics').find({}).toArray()
    ]);

    if (!blog) {
      req.flash('error', 'Blog not found');
      return res.redirect('/admin/dashboard');
    }

    res.render('edit_blog', {
      blog,         // send the blog for pre-filling
      authors,
      categories,
      tags,
      industries,
      topics,
      ucfirst
    });

  } catch (err) {
    console.error('Error loading blog/edit form:', err);
    req.flash('error', 'Could not load blog for editing');
    res.redirect('/admin/dashboard');
  }
});



app.post('/admin/blog/edit/:id', upload.single('blog_image'), async (req, res) => {
  try {
    const blogId = new ObjectId(req.params.id);
    const db = mongoose.connection.db;

    // Fetch existing blog
    const blog = await db.collection('blogs').findOne({ _id: blogId });
    if (!blog) {
      req.flash('error', 'Blog not found');
      return res.redirect('/admin/dashboard');
    }

    const {
      title,
      content,
      category,
      author,
      date,
      publish,
      meta_title,
      slug,
      tag,
      topics,
      industries,
      meta_description,
      schema_markup
    } = req.body;

    let blogImage = blog.image; // start with existing image

    // ✅ If new image uploaded, delete old one
    if (req.file) {
      blogImage = '/blogs/' + req.file.filename;

      if (blog.image) {
        const oldImagePath = path.join(__dirname, 'public', 'dist', blog.image);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.warn('Failed to delete old blog image:', err.message);
        });
      }
    }

    const updatedBlog = {
      title: title?.trim() || 'Untitled Blog',
      content: content?.trim() || '',
      category: category ? new ObjectId(category) : null,
      author: author ? new ObjectId(author) : null,
      image: blogImage,
      date: date ? new Date(date) : new Date(),
      publish: publish === 'on',
      read_time: calculateReadTime(content),
      tag: Array.isArray(tag)
        ? tag.map(t => new ObjectId(t))
        : tag
        ? [new ObjectId(tag)]
        : [],
      topics: Array.isArray(topics)
        ? topics.map(t => new ObjectId(t))
        : topics
        ? [new ObjectId(topics)]
        : [],
      industries: Array.isArray(industries)
        ? industries.map(t => new ObjectId(t))
        : industries
        ? [new ObjectId(industries)]
        : [],  
      meta: {
        title: meta_title?.trim() || '',
        slug: slug?.trim() || '',
        description: meta_description?.trim() || '',
        schema: schema_markup?.trim() || ''
      }
    };

    await db.collection('blogs').updateOne(
      { _id: blogId },
      { $set: updatedBlog }
    );

    req.flash('success', 'Blog updated successfully!');
    res.redirect(`/admin/edit_blog/${req.params.id}`);

  } catch (err) {
    console.error('Error updating blog:', err);
    req.flash('error', 'Something went wrong during blog update');
    res.redirect('/admin/dashboard');
  }
});


  app.get('/admin/view_blogs',isAuthenticated,async(req,res)=>{


    const blogs=mongoose.connection.db.collection('blogs');
    res.render('view_blogs',{blogs:blogs||null});
  });

  app.get('/admin/create_category',isAuthenticated,(req,res)=>{

    res.render('create_category');

  });


  app.get('/admin/view_casestudies',isAuthenticated,async(req,res)=>{


    // const blogs=mongoose.connection.db.collection('blogs');
    res.render('view_casestudies');
  });

   app.get('/admin/view_whitepapers',isAuthenticated,async(req,res)=>{


    // const blogs=mongoose.connection.db.collection('blogs');
    res.render('view_whitepapers');
  });

  app.get('/admin/view_webinars',isAuthenticated,async(req,res)=>{


    // const blogs=mongoose.connection.db.collection('blogs');
    res.render('view_webinars');
  });

  app.get('/admin/view_datasheets',isAuthenticated,async(req,res)=>{


    // const blogs=mongoose.connection.db.collection('blogs');
    res.render('view_datasheets');
  });

  app.get('/admin/create_category',isAuthenticated,(req,res)=>{

    res.render('create_category');

  });

  app.get('/admin/create_tags',isAuthenticated,(req,res)=>{

    res.render('add_tags');

  });

  app.get('/admin/add_author',isAuthenticated,(req,res)=>{

    res.render('add_author');

  });


  //code for editing case study thing

  app.post('/admin/edit/casestudy_business_cards/:docId', upload.single('image'), async (req, res) => {
  try {
    const docId = req.params.docId;
    const cardId = req.body.id;
    const { number, content } = req.body;

    if (!cardId) {
      return res.status(400).json({ status: 'error', message: 'Card ID is missing.' });
    }

    const collection = mongoose.connection.db.collection('landingpage');
    const doc = await collection.findOne({ _id: new ObjectId(docId) });

    if (!doc) {
      return res.status(404).json({ status: 'error', message: 'Document not found.' });
    }

    const cards = doc.business_cards || [];

    let oldImagePath = null;

    const updatedCards = cards.map(card => {
      if (card.id === cardId) {
        card.number = number;
        card.content = content;

        if (req.file) {
          oldImagePath = card.image;
          card.image = `/uploads/${req.file.filename}`;
        }
      }
      return card;
    });

    await collection.updateOne(
      { _id: new ObjectId(docId) },
      { $set: { business_cards: updatedCards } }
    );

    // Delete old image if a new one was uploaded
    if (req.file && oldImagePath) {
      const fileToDelete = path.join(__dirname, 'public', 'dist', oldImagePath.replace(/^\/uploads\//, 'uploads/'));
      fs.unlink(fileToDelete, err => {
        if (err) {
          console.warn('⚠️ Could not delete old image:', fileToDelete);
        }
      });
    }

    res.json({ status: 'success', message: 'Business card updated successfully.' });

  } catch (err) {
    console.error('❌ Update error:', err);
    res.status(500).json({ status: 'error', message: 'Server error during update.' });
  }
});

//edited part

  // app.get('/admin/create_subcategory',isAuthenticated,(req,res)=>{


  //   res.render('');
  // });

  app.post('/admin/landingpage',upload.fields([
    { name: 'hero_image', maxCount: 1 },
    { name: 'knowmore_image', maxCount: 1 },
    { name:'card_one',maxCount:1},
    { name:'card_two',maxCount:1},
    {name:'industry_report',maxCount:1},
    { name: 'businessinvalue_img' } ,// handles all journey card images
    { name: 'case_study', maxCount: 1 },
    { name: 'white_paper', maxCount: 1 }, 
    {name:'datasheet',maxCount:1},
    { name: 'featured_image', maxCount: 1 },
  ]),async(req,res)=>{

    console.log('hit');
  


  
    
      try {
        const collection = mongoose.connection.db.collection('landingpage');
        
        const page=req.body.page;
      

        const heroimageFile = req.files?.hero_image?.[0];
        const newHeroImagePath = heroimageFile ? '/uploads/' + heroimageFile.filename : null;

        
const cardoneimageFile = req.files?.card_one?.[0];
const newcardoneImagePath = cardoneimageFile ? '/uploads/' + cardoneimageFile.filename : null;


        const cardtwoimageFile = req.files?.card_two?.[0];
        const newcardtwoImagePath = cardtwoimageFile ? '/uploads/' + cardtwoimageFile.filename : null;
    
  
    
      
         const knowmoreImageFile = req.files?.knowmore_image?.[0];
        const knowmoreImagePath = knowmoreImageFile
  ? '/uploads/' + knowmoreImageFile.filename
  : null;


        //calsoft case study part

        // Case Study PDF handling (NO existingDoc logic)

        let caseStudyPath=null;
        let whitePaperPath=null;
        let datasheetPath=null;
        let industryPath =null;
        if(page=='case_study'){

          const caseStudyFile = req.files?.case_study?.[0];
        caseStudyPath = caseStudyFile
          ? '/casestudies/' + caseStudyFile.filename
          : null;

        }else if(page=='datasheet'){

          const datasheetFile = req.files?.datasheet?.[0];
        datasheetPath = datasheetFile
          ? '/datasheets/' + datasheetFile.filename
          : null;

        }else if(page=='industry_report'){

          const industryFile = req.files?.industry_report?.[0];
        industryPath = industryFile
          ? '/industry_reports/' + industryFile.filename
          : null;

        }else{

          const whitePaperFile = req.files?.white_paper?.[0];
       whitePaperPath = whitePaperFile
          ? '/whitepapers/' + whitePaperFile.filename
          : null;
        }
        


          //featured image 

          const featuredImageFile = req.files?.featured_image?.[0];
          const featured_image = featuredImageFile ? '/uploads/' + featuredImageFile.filename : null;
    
        // 4. Business value cards handling (previously sec2_entries)
        // const existingBusinessCards = existingDoc?.business_cards || [];
        // let usedIds = existingBusinessCards.map(e => parseInt(e.id)).filter(id => !isNaN(id));
        // let currentCounter = usedIds.length > 0 ? Math.max(...usedIds) + 1 : 1;
    
        // const businessTitles = req.body.businessinvalue_stitle || [];
        // const businessContents = req.body.businessinvalue_scontent || [];
        // const businessImages = req.files?.businessinvalue_img || [];
    
        // const businessCards = [...existingBusinessCards];
        // for (let i = 0; i < businessTitles.length; i++) {
        //   if (!businessTitles[i] && !businessContents[i] && !businessImages[i]) continue;
    
        //   businessCards.push({
        //     id: currentCounter.toString(),
        //     number: businessTitles[i],
        //     content: businessContents[i],
        //     image: businessImages[i] ? '/uploads/' + businessImages[i].filename : null
        //   });
    
        //   currentCounter++;
        // }

const businessCards = [];

        if(page=='case_study' || page=='datasheet'){

          let currentCounter = 1;

const businessTitles = req.body.businessinvalue_stitle || [];
const businessContents = req.body.businessinvalue_scontent || [];
const businessImages = req.files?.businessinvalue_img || [];


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
        }

        const tag=req.body.tag;
    
        // 5. Construct final data
        const formData = {
          page: req.body.page || "homepage",
    
          // Hero section
          hero_title1: req.body.hero_title1,
          hero_title2: req.body.hero_title2,
          hero_content: req.body.hero_content,
          hero_image: newHeroImagePath,
          card_one:newcardoneImagePath,
          card_two:newcardtwoImagePath,
          case_study:caseStudyPath,
          white_paper:whitePaperPath,
          industry_report:industryPath,
          datasheet:datasheetPath,
          featured_image:featured_image,
          herobtn_text: req.body.herobtn_text,
          herobtn_url: req.body.herobtn_url,
    
          // Calsoft in focus
          calsoftinfocus_title: req.body.calsoftinfocus_title,
          calsoftinfocus_checkboxtext: req.body.calsoftinfocus_checkboxtext,
          calsoftinfocus_text: req.body.calsoftinfocus_text,
          hubspot_form:req.body.hubspot_form,
    
          // Business value section
          businessinvalue_title:req.body.businessinvalue_title,
          business_cards: businessCards,
    
          // Know more section
          knowmore_title1: req.body.knowmore_title1,
          knowmore_text: req.body.knowmore_text,
          knowmore_btn_text: req.body.knowmore_btn_text,
          knowmore_btn_url: req.body.knowmore_btn_url,
          knowmoreimage: knowmoreImagePath,
          tag: Array.isArray(tag)
    ? tag.map(t => new ObjectId(t))         // if multiple tags
    : tag
    ? [new ObjectId(tag)]                  // if only one tag selected
    : [],

          // ➕ SEO Fields
          meta: {
    title: req.body.meta_title?.trim() || '',
    
    description: req.body.meta_description?.trim() || '',
    schema: req.body.schema_markup?.trim() || '',
    slug:req.body.slug?.trim()||'',
  },
          // meta_title: req.body.meta_title,
          // slug: req.body.slug,
          // meta_description: req.body.meta_description,
          // schema_markup: req.body.schema_markup,
        };
    
        // 6. Save to DB
        // await collection.findOneAndUpdate(
        //   {},
        //   { $set: formData },
        //   { upsert: true }
        // );
        await collection.insertOne(formData);
    
       
        req.flash('success', 'All changes have been applied.');
        res.redirect(`/admin/landingpage/${req.body.page}`);
    
      } catch (er) {
        console.log(er.message);
       
        req.flash('error', 'Something went wrong');
        res.redirect(`/admin/landingpage/${req.body.page}`);
      }
      
      
    });


    //new landing code
    app.post('/admin/webinar',upload.fields([
    { name: 'hero_image', maxCount: 1 },
    { name: 'knowmore_image', maxCount: 1 },
    { name:'card_one',maxCount:1},
    { name:'card_two',maxCount:1},
    { name: 'businessinvalue_img' } ,// handles all journey card images
    { name: 'webinar', maxCount: 1 }, 
    { name: 'featured_image', maxCount: 1 },
  ]),async(req,res)=>{

    console.log('hit');
  


  
    
      try {
        const collection = mongoose.connection.db.collection('landingpage');
        
        const page=req.body.page;
        const heroimageFile = req.files?.hero_image?.[0];
        const newHeroImagePath = heroimageFile ? '/uploads/' + heroimageFile.filename : null;

      
        // ✅ Card one image handling (pure insert logic)
const cardoneimageFile = req.files?.card_one?.[0];
const newcardoneImagePath = cardoneimageFile ? '/uploads/' + cardoneimageFile.filename : null;


      
        // const cardtwoimageFile = req.files?.card_two?.[0];
        // const newcardtwoImagePath = cardtwoimageFile ? '/uploads/' + cardtwoimageFile.filename : null;
    
  
    
      
         const knowmoreImageFile = req.files?.knowmore_image?.[0];
        const knowmoreImagePath = knowmoreImageFile
  ? '/uploads/' + knowmoreImageFile.filename
  : null;


        //calsoft case study part

        // Case Study PDF handling (NO existingDoc logic)

       
        let webinarPath=null;
     
          const webinarFile = req.files?.webinar?.[0];
       webinarPath = webinarFile
          ? '/webinars/' + webinarFile.filename
          : null;
     
        


          //featured image 

          const featuredImageFile = req.files?.featured_image?.[0];
          const featured_image = featuredImageFile ? '/uploads/' + featuredImageFile.filename : null;
    
      

const businessCards = [];

      

          let currentCounter = 1;

const businessTitles = req.body.businessinvalue_stitle || [];
const businessContents = req.body.businessinvalue_scontent || [];
const businessImages = req.files?.businessinvalue_img || [];


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

//cards1

const businessCards1 = [];

      

          let currentCounter1 = 1;

const businessTitles1 = req.body.businessinvalue_stitle1 || [];
const businessContents1 = req.body.businessinvalue_scontent1 || [];



for (let i = 0; i < businessTitles.length; i++) {
  if (!businessTitles1[i] && !businessContents1[i]) continue;

  businessCards1.push({
    id: currentCounter.toString(),
    number: businessTitles1[i],
    content: businessContents1[i],
    
  });

  currentCounter1++;
}
//cards2

const businessCards2 = [];
let currentCounter2 = 1;

const businessTitles2 = req.body.businessinvalue_stitle2 || [];
const businessContents2 = req.body.businessinvalue_scontent2 || [];

for (let i = 0; i < businessTitles2.length; i++) {
  if (!businessTitles2[i] && !businessContents2[i]) continue;

  businessCards2.push({
    id: currentCounter2.toString(),
    number: businessTitles2[i],
    content: businessContents2[i],
  });

  currentCounter2++;
}


//cards3

const businessCards3 = [];
let currentCounter3 = 1;

const businessTitles3 = req.body.businessinvalue_stitle3 || [];
const businessContents3 = req.body.businessinvalue_scontent3 || [];

for (let i = 0; i < businessTitles3.length; i++) {
  if (!businessTitles3[i] && !businessContents3[i]) continue;

  businessCards3.push({
    id: currentCounter3.toString(),
    number: businessTitles3[i],
    content: businessContents3[i],
  });

  currentCounter3++;
}

        

        const tag=req.body.tag;
        const speakers=req.body.speaker;
        const hosts=req.body.host;
    
        // 5. Construct final data
        const formData = {
          page: req.body.page || "homepage",
    
          // Hero section
          hero_title1: req.body.hero_title1,
          hero_title2: req.body.hero_title2,
          hero_content: req.body.hero_content,
          hero_image: newHeroImagePath,
          card_one:newcardoneImagePath,
         
          
          webinar:webinarPath,
          featured_image:featured_image,
          herobtn_text: req.body.herobtn_text,
          herobtn_url: req.body.herobtn_url,
          
          embedurl:req.body.embed_url,
    
          // Calsoft in focus
          calsoftinfocus_title: req.body.calsoftinfocus_title,
          calsoftinfocus_checkboxtext: req.body.calsoftinfocus_checkboxtext,
          calsoftinfocus_text: req.body.calsoftinfocus_text,
          hubspot_form:req.body.hubspot_form,

          //continuing commitment
          continuingcommitment_title:req.body.continuingcommitment_title,
          continuingcommitment_text:req.body.continuingcommitment_text,
    
          // Business value section
          recommendedfor_title:req.body.recommendedfor_title,
          business_cards: businessCards,
          business_cards1: businessCards1,
          business_cards2: businessCards2,
          business_cards3: businessCards3,
    
          // Know more section
          knowmore_title1: req.body.knowmore_title1,
          knowmore_title2: req.body.knowmore_title2,
          
          knowmoreimage: knowmoreImagePath,
          tag: Array.isArray(tag)
    ? tag.map(t => new ObjectId(t))         // if multiple tags
    : tag
    ? [new ObjectId(tag)]                  // if only one tag selected
    : [],

    speakers: Array.isArray(speakers)
    ? speakers.map(t => new ObjectId(t))         // if multiple speakers
    : speakers
    ? [new ObjectId(speakers)]                  // if only one speaker selected
    : [],

    hosts: Array.isArray(hosts)
    ? hosts.map(t => new ObjectId(t))         // if multiple hosts
    : hosts
    ? [new ObjectId(hosts)]                  // if only one host selected
    : [],

          // ➕ SEO Fields
          meta: {
    title: req.body.meta_title?.trim() || '',
    
    description: req.body.meta_description?.trim() || '',
    schema: req.body.schema_markup?.trim() || ''
  },
      
        };
    
        await collection.insertOne(formData);
    
       
        req.flash('success', 'All changes have been applied.');
        res.redirect(`/admin/landingpage/${req.body.page}`);
    
      } catch (er) {
        console.log(er.message);
       
        req.flash('error', 'Something went wrong');
        res.redirect(`/admin/landingpage/${req.body.page}`);
      }
      
      
    });



  //api routes come in here 

  app.get('/api/homepage',async(req,res)=>{

    const data = await mongoose.connection.db.collection('homepage').findOne({});
    console.log(data);
    res.json({data:data});
  });

  app.get('/api/popupform/:class', async (req, res) => {
    try {
      const className = req.params.class;
  
      const data = await mongoose.connection.db
        .collection('popups')
        .findOne({ css_selector: className });
  
      if (!data) {
        return res.status(404).json({ message: 'No popup form found for this class' });
      }
  
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

 // GET all videos
app.get('/api/videos', async (req, res) => {
  try {
    // get all documents from the videos collection
    const videos = await mongoose.connection.db
      .collection('videos')
      .find({})
      .toArray(); // convert the cursor to an array

    // If no videos found
    if (!videos || videos.length === 0) {
      return res.status(404).json({ message: 'No videos found' });
    }

    // Send the videos back as JSON
    res.json({ videos });
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

  
  app.get('/api/casestudy/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 🛡️ Validate ID format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid case study ID' });
    }

    // ✅ Convert to ObjectId
    const objectId = new ObjectId(id);

    // 🔍 Query MongoDB
    const data = await mongoose.connection.db
      .collection('landingpage')
      .findOne({ _id: objectId });

    if (!data) {
      return res.status(404).json({ error: 'Case study not found' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error fetching case study:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// app.get('/api/casestudy', async (req, res) => {
//   try {
//     const collection = mongoose.connection.db.collection('landingpage');

//     // Query only documents where page is 'case_study'
//     const data = await collection.find({ page: 'case_study' }).toArray();

//     if (!data || data.length === 0) {
//       return res.status(404).json({ error: 'There are no case studies' });
//     }

//     res.json({ data });
//   } catch (error) {
//     console.error('Error fetching case study:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

app.get('/api/casestudy', async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('landingpage');

    const { limit } = req.query;
    const numericLimit = parseInt(limit, 10); // Convert to integer

    const query = { page: 'case_study' };

    // Sort by _id descending (latest first)
    let cursor = collection.find(query).sort({ _id: -1 });

    // If valid limit is given, apply it
    if (!isNaN(numericLimit) && numericLimit > 0) {
      cursor = cursor.limit(numericLimit);
    }

    const data = await cursor.toArray();

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'There are no case studies' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error fetching case study:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



app.get('/api/whitepapers', async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('landingpage');

    // Query only documents where page is 'case_study'
    const data = await collection.find({ page: 'white_paper' }).toArray();

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'There are no white papers' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error fetching white papers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/api/industry_reports', async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('landingpage');

    // Query only documents where page is 'case_study'
    const data = await collection.find({ page: 'industry_report' }).toArray();

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'There are no reports' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



app.get('/api/datasheets', async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('landingpage');

    // Query only documents where page is 'case_study'
    const data = await collection.find({ page: 'datasheet' }).toArray();

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'There are no datasheets' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error fetching datasheets:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/api/webinars', async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('landingpage');

    const data = await collection.aggregate([
      { $match: { page: 'webinar' } },

      // Replace speakers field with full objects
      {
        $lookup: {
          from: 'speakerhost',
          localField: 'speakers',
          foreignField: '_id',
          as: 'speakers'
        }
      },

      // Replace hosts field with full objects
      {
        $lookup: {
          from: 'speakerhost',
          localField: 'hosts',
          foreignField: '_id',
          as: 'hosts'
        }
      }
    ]).toArray();

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'There are no webinars' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error fetching webinars:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// app.get('/api/blogs', async (req, res) => {
//   try {
//     const collection = mongoose.connection.db.collection('blogs');

//     const data = await collection.aggregate([
//       {
//         $match: { publish: true } // Only fetch published blogs
//       },
//       {
//         $lookup: {
//           from: 'categories',
//           localField: 'category',
//           foreignField: '_id',
//           as: 'categoryData'
//         }
//       },
//       {
//         $unwind: {
//           path: '$categoryData',
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {
//         $lookup: {
//           from: 'authors',
//           localField: 'author',
//           foreignField: '_id',
//           as: 'authorData'
//         }
//       },
//       {
//         $unwind: {
//           path: '$authorData',
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {
//         $lookup: {
//           from: 'tags',
//           localField: 'tag',
//           foreignField: '_id',
//           as: 'tagData'
//         }
//       },
//       {
//         $sort: { date: -1 } // optional: newest first
//       }
//     ]).toArray();

//     res.json({ data });
//   } catch (error) {
//     console.error('Error fetching blogs:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// app.get('/api/blogs', async (req, res) => {
//   try {
//     const collection = mongoose.connection.db.collection('blogs');

//     const { author, tag, category } = req.query;

//     // Build dynamic filters
//     const matchStage = { publish: true };

//     if (author) {
//       matchStage.author = new mongoose.Types.ObjectId(author);
//     }

//     if (tag) {
//       matchStage.tag = new mongoose.Types.ObjectId(tag); // assuming tag is a single ObjectId field
//     }

//     if (category) {
//       matchStage.category = new mongoose.Types.ObjectId(category);
//     }

//     const data = await collection.aggregate([
//       { $match: matchStage },
//       {
//         $lookup: {
//           from: 'categories',
//           localField: 'category',
//           foreignField: '_id',
//           as: 'categoryData'
//         }
//       },
//       {
//         $unwind: {
//           path: '$categoryData',
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {
//         $lookup: {
//           from: 'authors',
//           localField: 'author',
//           foreignField: '_id',
//           as: 'authorData'
//         }
//       },
//       {
//         $unwind: {
//           path: '$authorData',
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {
//         $lookup: {
//           from: 'tags',
//           localField: 'tag',
//           foreignField: '_id',
//           as: 'tagData'
//         }
//       },
//       {
//         $sort: { date: -1 }
//       }
//     ]).toArray();

//     res.json({ data });
//   } catch (error) {
//     console.error('Error fetching blogs:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// app.get('/api/blogs', async (req, res) => {
//   try {
//     const collection = mongoose.connection.db.collection('blogs');

//     const { author, industry, topic } = req.query;

//     // Dynamic match object
//     const matchStage = { publish: true };

//     // Add author filter (if provided)
//     if (author) {
//       matchStage.author = new mongoose.Types.ObjectId(author);
//     }

//     // Add industry filter (if provided)
//     if (industry) {
//       matchStage.tag = new mongoose.Types.ObjectId(industry); // assuming 1 industry
//     }

//     // Add topic filter (can be max 3 topics)
//     if (topic) {
//       let topicArray = topic;

//       if (!Array.isArray(topic)) {
//         topicArray = [topic];
//       }

//       // Limit to 3 topics only
//       topicArray = topicArray.slice(0, 3);

//       // Convert to ObjectIds
//       const topicObjectIds = topicArray.map(id => new mongoose.Types.ObjectId(id));
//       matchStage.category = { $in: topicObjectIds };
//     }

//     const data = await collection.aggregate([
//       { $match: matchStage },
//       {
//         $lookup: {
//           from: 'categories',
//           localField: 'category',
//           foreignField: '_id',
//           as: 'categoryData'
//         }
//       },
//       { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: 'authors',
//           localField: 'author',
//           foreignField: '_id',
//           as: 'authorData'
//         }
//       },
//       { $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: 'tags',
//           localField: 'tag',
//           foreignField: '_id',
//           as: 'tagData'
//         }
//       },
//       { $unwind: { path: '$tagData', preserveNullAndEmptyArrays: true } },
//       { $sort: { date: -1 } }
//     ]).toArray();

//     res.json({ data });
//   } catch (error) {
//     console.error('Error fetching blogs:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// this one is wrong dude the blogs are getting duplicated because of unwind and other crap
// app.get('/api/blogs', async (req, res) => {
//   try {
//     const collection = mongoose.connection.db.collection('blogs');

//     const { author, industry, topic, limit } = req.query;
//     const numericLimit = parseInt(limit, 10); // Convert limit to integer

//     // Dynamic match object
//     const matchStage = { publish: true };

//     // Add author filter (if provided)
//     if (author) {
//       matchStage.author = new mongoose.Types.ObjectId(author);
//     }

//     // Add industry filter (if provided)
//     if (industry) {
//       matchStage.tag = new mongoose.Types.ObjectId(industry);
//     }

//     // Add topic filter (max 3 topics)
//     if (topic) {
//       let topicArray = Array.isArray(topic) ? topic : [topic];
//       topicArray = topicArray.slice(0, 3);
//       const topicObjectIds = topicArray.map(id => new mongoose.Types.ObjectId(id));
//       matchStage.category = { $in: topicObjectIds };
//     }

//     // Build aggregation pipeline
//     const pipeline = [
//       { $match: matchStage },
//       {
//         $lookup: {
//           from: 'categories',
//           localField: 'category',
//           foreignField: '_id',
//           as: 'categoryData'
//         }
//       },
//       { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: 'authors',
//           localField: 'author',
//           foreignField: '_id',
//           as: 'authorData'
//         }
//       },
//       { $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: 'tags',
//           localField: 'tag',
//           foreignField: '_id',
//           as: 'tagData'
//         }
//       },
//       { $unwind: { path: '$tagData', preserveNullAndEmptyArrays: true } },
//       { $sort: { date: -1 } }
//     ];

//     // Apply limit if provided
//     if (!isNaN(numericLimit) && numericLimit > 0) {
//       pipeline.push({ $limit: numericLimit });
//     }

//     const data = await collection.aggregate(pipeline).toArray();

//     res.json({ data });
//   } catch (error) {
//     console.error('Error fetching blogs:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


//the api which should work fine 
app.get('/api/blogs', async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('blogs');

    const { author, industry, topic, limit } = req.query;
    const numericLimit = parseInt(limit, 10); // Convert limit to integer

    // Dynamic match object
    const matchStage = { publish: true };

    // Add author filter (if provided)
    if (author) {
      matchStage.author = new mongoose.Types.ObjectId(author);
    }

    // Add industry filter (if provided)
    if (industry) {
      matchStage.tag = new mongoose.Types.ObjectId(industry);
    }

    // Add topic filter (max 3 topics)
    if (topic) {
      let topicArray = Array.isArray(topic) ? topic : [topic];
      topicArray = topicArray.slice(0, 3);
      const topicObjectIds = topicArray.map(id => new mongoose.Types.ObjectId(id));
      matchStage.category = { $in: topicObjectIds };
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $lookup: {
          from: 'authors',
          localField: 'author',
          foreignField: '_id',
          as: 'authorData'
        }
      },
      {
        $lookup: {
          from: 'tags',
          localField: 'tag',
          foreignField: '_id',
          as: 'tagData'
        }
      },
      { $sort: { date: -1 } }
    ];

    // Apply limit if provided
    if (!isNaN(numericLimit) && numericLimit > 0) {
      pipeline.push({ $limit: numericLimit });
    }

    const data = await collection.aggregate(pipeline).toArray();

    res.json({ data });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});




//filters for the blogs
app.get('/api/blogs/filters',async(req,res)=>{

  const authors=await mongoose.connection.db.collection('authors').find().toArray();
  const tags=await mongoose.connection.db.collection('tags').find().toArray();
  const categories=await mongoose.connection.db.collection('categories').find().toArray();
  const topics=await mongoose.connection.db.collection('topics').find().toArray();
  const industries=await mongoose.connection.db.collection('industries').find().toArray();

  res.json({authors,tags,categories,topics,industries});
});

app.get('/api/tags',async(req,res)=>{

  const tags=await mongoose.connection.db.collection('tags').find().toArray();
  // const tags=await mongoose.connection.db.collection('categories').find().toArray();
  // const categories=await mongoose.connection.db.collection('tags').find().toArray();

  res.json({tags});
});

//searching for specific blogs depending on the filters 

app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blogId = req.params.id;

    // Validate ObjectId
    if (!ObjectId.isValid(blogId)) {
      return res.status(400).json({ error: 'Invalid blog ID' });
    }

    const collection = mongoose.connection.db.collection('blogs');

    const data = await collection.aggregate([
      {
        $match: {
          _id: new ObjectId(blogId),
          publish: true // only return if published
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $unwind: {
          path: '$categoryData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'authors',
          localField: 'author',
          foreignField: '_id',
          as: 'authorData'
        }
      },
      {
        $unwind: {
          path: '$authorData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'tags',
          localField: 'tag',
          foreignField: '_id',
          as: 'tagData'
        }
      }
    ]).toArray();

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Blog not found or unpublished' });
    }

    res.json({ data: data[0] }); // Return the single blog object
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

//usecases

// 🔹 Get all usecases
app.get('/api/usecases', async (req, res) => {
  try {
    const usecasesCollection = mongoose.connection.db.collection('usecases');
    const tagsCollection = mongoose.connection.db.collection('tags');

    const { limit } = req.query;
    const numericLimit = parseInt(limit, 10);

    let cursor = usecasesCollection.find({}).sort({ _id: -1 }); // latest first

    if (!isNaN(numericLimit) && numericLimit > 0) {
      cursor = cursor.limit(numericLimit);
    }

    const usecases = await cursor.toArray();

    if (!usecases || usecases.length === 0) {
      return res.status(404).json({ error: 'There are no usecases' });
    }

    // Fetch all tag IDs used across usecases
    const allTagIds = usecases
      .flatMap(uc => uc.tags || [])
      .map(tagId => new ObjectId(tagId));

    // Fetch tag names
    const tagsData = await tagsCollection
      .find({ _id: { $in: allTagIds } })
      .toArray();

    // Map tags to usecases
    const usecasesWithTagNames = usecases.map(uc => {
      const tagsWithNames = (uc.tags || []).map(tagId => {
        const tagObj = tagsData.find(t => t._id.equals(tagId));
        return tagObj ? { _id: tagObj._id, name: tagObj.name } : null;
      }).filter(Boolean);

      return {
        ...uc,
        originalTagIds: uc.tags, // optional: keep original IDs
        tags: tagsWithNames
      };
    });

    res.json({ data: usecasesWithTagNames });
  } catch (error) {
    console.error('Error fetching usecases:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

//route for all podcasts
app.get('/api/podcasts', async (req, res) => {
  try {
    const podcastsCollection = mongoose.connection.db.collection('podcasts');
    const speakersCollection = mongoose.connection.db.collection('speakerhost');

    const { limit } = req.query;
    const numericLimit = parseInt(limit, 10);

    let cursor = podcastsCollection.find({}).sort({ _id: -1 }); // latest first

    if (!isNaN(numericLimit) && numericLimit > 0) {
      cursor = cursor.limit(numericLimit);
    }

    const podcasts = await cursor.toArray();

    if (!podcasts || podcasts.length === 0) {
      return res.status(404).json({ error: 'There are no podcasts' });
    }

    // 🔹 Collect all unique speaker IDs across podcasts
    const allSpeakerIds = podcasts
      .flatMap(p => p.speakers || [])
      .map(id => new ObjectId(id));

    // 🔹 Fetch all speaker details in one query
    const speakersData = await speakersCollection
      .find({ _id: { $in: allSpeakerIds } })
      .toArray();

    // 🔹 Attach speaker details to each podcast
    const podcastsWithSpeakers = podcasts.map(podcast => {
      const speakersWithDetails = (podcast.speakers || []).map(speakerId => {
        const sp = speakersData.find(s => s._id.equals(speakerId));
        return sp ? { 
          _id: sp._id, 
          name: sp.name, 
          designation: sp.designation, 
          image: sp.image 
        } : null;
      }).filter(Boolean);

      return {
        ...podcast,
        originalSpeakerIds: podcast.speakers, // keep original IDs if you want
        speakers: speakersWithDetails
      };
    });

    res.json({ data: podcastsWithSpeakers });
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

//route for individual podcast
// 🔹 Get single podcast (with speaker details)
app.get('/api/podcasts/:id', async (req, res) => {
  try {
    const podcastsCollection = mongoose.connection.db.collection('podcasts');
    const speakersCollection = mongoose.connection.db.collection('speakerhost');

    const podcastId = req.params.id;

    // Validate ObjectId
    if (!ObjectId.isValid(podcastId)) {
      return res.status(400).json({ error: 'Invalid podcast ID' });
    }

    // Fetch the podcast
    const podcast = await podcastsCollection.findOne({ _id: new ObjectId(podcastId) });

    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    // Fetch speakers
    const speakerIds = (podcast.speakers || []).map(id => new ObjectId(id));
    let speakersWithDetails = [];

    if (speakerIds.length > 0) {
      const speakersData = await speakersCollection
        .find({ _id: { $in: speakerIds } })
        .toArray();

      speakersWithDetails = speakerIds.map(sid => {
        const sp = speakersData.find(s => s._id.equals(sid));
        return sp ? {
          _id: sp._id,
          name: sp.name,
          designation: sp.designation,
          image: sp.image
        } : null;
      }).filter(Boolean);
    }

    // Build response
    const podcastWithSpeakers = {
      ...podcast,
      originalSpeakerIds: podcast.speakers, // optional
      speakers: speakersWithDetails
    };

    res.json({ data: podcastWithSpeakers });
  } catch (error) {
    console.error('Error fetching podcast:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// 🔹 Get specific usecase by ID
// 🔹 Get specific usecase by ID with tag names
app.get('/api/usecase/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid usecase ID' });
    }

    const objectId = new ObjectId(id);

    const usecasesCollection = mongoose.connection.db.collection('usecases');
    const tagsCollection = mongoose.connection.db.collection('tags');

    // Fetch the usecase
    const usecase = await usecasesCollection.findOne({ _id: objectId });

    if (!usecase) {
      return res.status(404).json({ error: 'Usecase not found' });
    }

    // If usecase has tags, fetch tag names
    let tagsWithNames = [];
    if (usecase.tags && usecase.tags.length > 0) {
      const tagObjectIds = usecase.tags.map(tagId => new ObjectId(tagId));
      const tagsData = await tagsCollection
        .find({ _id: { $in: tagObjectIds } })
        .toArray();

      tagsWithNames = tagsData.map(tag => ({ _id: tag._id, name: tag.name }));
    }

    // Return the usecase with tags replaced by tag objects
    res.json({
      data: {
        ...usecase,
        tags: tagsWithNames
      }
    });
  } catch (error) {
    console.error('Error fetching usecase:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// app.get('/api/global-filter', async (req, res) => {
//   try {
//     const { keyword, industries, categories, tags, topics } = req.query;

//     const industryFilter = industries ? industries.split(',') : [];
//     const categoryFilter = categories ? categories.split(',') : [];
//     const tagFilter = tags ? tags.split(',') : [];
//     const topicFilter = topics ? topics.split(',') : [];

//     const keywordRegex = keyword ? new RegExp(keyword, 'i') : null;

//     // Collections to search
//     const collections = [
//       { name: 'blogs', fields: { title: 1, image: 1, featured_image: 1, category: 1, tag: 1, industries: 1, topics: 1 } },
//       { name: 'landingpages', fields: { title: 1, card_one: 1, card_two: 1, featured_image: 1, page: 1, tag: 1, industries: 1, topics: 1 } },
//       { name: 'usecases', fields: { title: 1, usecase_image: 1, tag: 1, industries: 1, topics: 1 } }
//     ];

//     const results = [];

//     for (const col of collections) {
//       const coll = mongoose.connection.db.collection(col.name);

//       const query = {};

//       // Keyword filter
//       if (keywordRegex) {
//         query.title = { $regex: keywordRegex };
//       }

//       // Apply filters based on the exact field names
//       if (categoryFilter.length) query.category = { $in: categoryFilter.map(id => new ObjectId(id)) };
//       if (tagFilter.length) query.tag = { $in: tagFilter.map(id => new ObjectId(id)) };
//       if (industryFilter.length) query.industries = { $in: industryFilter.map(id => new ObjectId(id)) };
//       if (topicFilter.length) query.topics = { $in: topicFilter.map(id => new ObjectId(id)) };

//       const data = await coll.find(query).toArray();

//       // Map results to minimal response
//       data.forEach(item => {
//         let cardImage = item.card_one || item.card_two || item.usecase_image || item.image || item.featured_image || null;
//         results.push({
//           _id: item._id,
//           title: item.title || item.hero_title1 || 'No Title',
//           card_image: cardImage,
//           collection: col.name
//         });
//       });
//     }

//     res.json({ results });
//   } catch (err) {
//     console.error('Global Filter Error:', err);
//     res.status(500).json({ error: 'Server Error' });
//   }
// });

// app.get('/api/global-filter', async (req, res) => {
//   try {
//     const { keyword, industries, categories, tags, topics, collection } = req.query;

//     const industryFilter = industries ? industries.split(',') : [];
//     const categoryFilter = categories ? categories.split(',') : [];
//     const tagFilter = tags ? tags.split(',') : [];
//     const topicFilter = topics ? topics.split(',') : [];

//     const keywordRegex = keyword ? new RegExp(keyword, 'i') : null;

//     // Base collections config
//     const allCollections = [
//       { name: 'blogs', fields: { title: 1, image: 1, featured_image: 1, category: 1, tag: 1, industries: 1, topics: 1 } },
//       { name: 'landingpages', fields: { title: 1, card_one: 1, card_two: 1, featured_image: 1, page: 1, tag: 1, industries: 1, topics: 1 } },
//       { name: 'usecases', fields: { title: 1, usecase_image: 1, tag: 1, industries: 1, topics: 1 } }
//     ];

//     // If ?collection= is passed, just use that one
//     let selectedCollections = allCollections;
//     if (collection) {
//       selectedCollections = allCollections.filter(col => col.name.toLowerCase() === collection.toLowerCase());
//       if (selectedCollections.length === 0) {
//         return res.status(400).json({ error: `Unknown collection "${collection}"` });
//       }
//     }

//     const results = [];

//     for (const col of selectedCollections) {
//       const coll = mongoose.connection.db.collection(col.name);

//       const query = {};

//       if (keywordRegex) {
//         query.title = { $regex: keywordRegex };
//       }

//       if (categoryFilter.length) query.category = { $in: categoryFilter.map(id => new ObjectId(id)) };
//       if (tagFilter.length) query.tag = { $in: tagFilter.map(id => new ObjectId(id)) };
//       if (industryFilter.length) query.industries = { $in: industryFilter.map(id => new ObjectId(id)) };
//       if (topicFilter.length) query.topics = { $in: topicFilter.map(id => new ObjectId(id)) };

//       const data = await coll.find(query, { projection: col.fields }).toArray();

//       data.forEach(item => {
//         const cardImage = item.card_one || item.card_two || item.usecase_image || item.image || item.featured_image || null;
//         results.push({
//           _id: item._id,
//           title: item.title || item.hero_title1 || 'No Title',
//           card_image: cardImage,
//           collection: col.name
//         });
//       });
//     }

//     res.json({ results });
//   } catch (err) {
//     console.error('Global Filter Error:', err);
//     res.status(500).json({ error: 'Server Error' });
//   }
// });

app.get('/api/global-filter', async (req, res) => {
  try {
    const { keyword, industries, categories, tags, topics, collection } = req.query;

    const industryFilter = industries ? industries.split(',') : [];
    const categoryFilter = categories ? categories.split(',') : [];
    const tagFilter = tags ? tags.split(',') : [];
    const topicFilter = topics ? topics.split(',') : [];

    const keywordRegex = keyword ? new RegExp(keyword, 'i') : null;

    // Base collections config
    const allCollections = [
      {
        name: 'blogs',
        fields: {
          title: 1,
          image: 1,
          featured_image: 1,
          category: 1,
          tag: 1,
          industries: 1,
          topics: 1,
        },
      },
      {
        name: 'landingpages',
        fields: {
          title: 1,
          hero_title1: 1,
          card_one: 1,
          card_two: 1,
          featured_image: 1,
          page: 1,
          tag: 1,
          industries: 1,
          topics: 1,
        },
      },
      {
        name: 'usecases',
        fields: {
          title: 1,
          usecase_image: 1,
          tag: 1,
          industries: 1,
          topics: 1,
        },
      },
    ];

    // If ?collection= is passed, just use that one
    let selectedCollections = allCollections;
    if (collection) {
      selectedCollections = allCollections.filter(
        (col) => col.name.toLowerCase() === collection.toLowerCase()
      );
      if (selectedCollections.length === 0) {
        return res
          .status(400)
          .json({ error: `Unknown collection "${collection}"` });
      }
    }

    const results = [];

    for (const col of selectedCollections) {
      const coll = mongoose.connection.db.collection(col.name);

      const query = {};

      // keyword matching per collection
      if (keywordRegex) {
        if (col.name === 'landingpages') {
          query.$or = [
            { hero_title1: { $regex: keywordRegex } },
            { title: { $regex: keywordRegex } },
          ];
        } else {
          query.title = { $regex: keywordRegex };
        }
      }

      if (categoryFilter.length)
        query.category = { $in: categoryFilter.map((id) => new ObjectId(id)) };
      if (tagFilter.length)
        query.tag = { $in: tagFilter.map((id) => new ObjectId(id)) };
      if (industryFilter.length)
        query.industries = {
          $in: industryFilter.map((id) => new ObjectId(id)),
        };
      if (topicFilter.length)
        query.topics = { $in: topicFilter.map((id) => new ObjectId(id)) };

      const data = await coll
        .find(query, { projection: col.fields })
        .toArray();

      data.forEach((item) => {
        const cardImage =
          item.card_one ||
          item.card_two ||
          item.usecase_image ||
          item.image ||
          item.featured_image ||
          null;
        results.push({
          _id: item._id,
          title: item.title || item.hero_title1 || 'No Title',
          card_image: cardImage,
          collection: col.name,
        });
      });
    }

    res.json({ results });
  } catch (err) {
    console.error('Global Filter Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.post("/api/apply", upload.single("resume"), async (req, res) => {
  try {
    const {
      name, email, phone, experience,
      currentCTC, expectedCTC, noticePeriod,
      currentLocation, designation, details
    } = req.body;

    // ✅ Build relative path for DB
    const resumeRelativePath = req.file ? `/cv/${req.file.filename}` : null;

    // Save to Mongo
    const newApplication = new CareerApplication({
      name,
      email,
      phone,
      experience,
      currentCTC,
      expectedCTC,
      noticePeriod,
      currentLocation,
      designation,
      details,
      resumePath: resumeRelativePath
    });

    await newApplication.save();

    // ---- Nodemailer config ----
    let transporter = nodemailer.createTransport({
      service: "Gmail", // or SMTP config if you have a company mail server
      auth: {
        user: process.env.MAIL_USER, // your email (set in env)
        pass: process.env.MAIL_PASS  // your password or app password
      }
    });

    // ---- Mail options ----
    let mailOptions = {
      from: `"Careers App" <${process.env.MAIL_USER}>`,
      to: "ta@calsoftinc.com",
      cc: "swanand.shinge@calsoftinc.com", 
      subject: `New Application - ${designation || "Candidate"}`,
      text: `
New job application received:

Name: ${name}
Email: ${email}
Phone: ${phone}
Experience: ${experience}
Current CTC: ${currentCTC}
Expected CTC: ${expectedCTC}
Notice Period: ${noticePeriod}
Current Location: ${currentLocation}
Designation: ${designation}

Details: ${details}
      `,
      // ✅ Nodemailer still needs absolute path (req.file.path)
      attachments: req.file
        ? [{ filename: req.file.originalname, path: req.file.path }]
        : []
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "Application submitted and emailed successfully!"
    });
  } catch (err) {
    console.error("Career application error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
});

//expressListRoutes(app, { prefix: '' });

// hello
app.listen(process.env.PORT,(err)=>{
  if (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
    console.log('the server is listening',`http://localhost:${process.env.PORT}`);
});


