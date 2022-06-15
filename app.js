const express = require('express')
const app = express()
const path = require('path')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const session = require('express-session')
const catchAsync = require('./utils/CatchAsync')
const ExpressError = require('./utils/ExpressError')
const Joi = require('joi')
const {campgroundSchema, reviewSchema} = require('./schemas.js')
const Review = require('./models/review')
const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:/yelp-camp')
.then(()=>{
    console.log('DB connected')
})

const campgrounds = require('./routes/campgrounds')
const reviews = require('./routes/reviews')

const Campground = require('./models/campground')
// const campground = require('./models/campground')

app.engine('ejs', ejsMate)
/* Setting View Engine for EJS */
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views')) 
/* For Parsing The Json Data in Browser */
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly:true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))


app.use('/campgrounds', campgrounds)
app.use('/campgrounds/:id/reviews', reviews)

/* Render Home.ejs */
app.get('/', (req, res)=>{
    res.render('home')
})


app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found'))
})

app.use((err, req, res, next) => {
    const {statusCode = 500} = err;
    if(!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', {err})
    // res.send('Oh Boy, Something Went Wrong!')
})

app.listen(3000, () => {
    console.log('Serving on Port 3000')
})
