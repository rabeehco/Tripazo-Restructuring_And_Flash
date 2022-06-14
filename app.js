const express = require('express')
const app = express()
const path = require('path')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
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

const Campground = require('./models/campground')
const campground = require('./models/campground')

app.engine('ejs', ejsMate)
/* Setting View Engine for EJS */
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views')) 
/* For Parsing The Json Data in Browser */
app.use(express.urlencoded({extended: true}))

app.use(methodOverride('_method'))

const validateCampground = (req, res, next) => {
    const {error} = campgroundSchema.validate(req.body)
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next()
    }
}

const validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body)
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next()
    }
}

/* Render Home.ejs */
app.get('/', (req, res)=>{
    res.render('home')
})
/* Campgrounds Route and fetching all the data from Campground and passing it to ejs files */
app.get('/campgrounds', catchAsync(async(req, res)=>{
    const campgrounds = await Campground.find({})   
    res.render('campgrounds/index', {campgrounds})
}))
/* Render New.ejs for Creating new Campground */ 
app.get('/campgrounds/new', (req, res) => {
    res.render('campgrounds/new')
})


/* Post request to Send it to Mongodb and Redirect to it's page */
app.post('/campgrounds', validateCampground, catchAsync(async(req, res, next) => {
        // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400)
        const campground = new Campground(req.body.campground)
        await campground.save()
        res.redirect(`/campgrounds/${campground._id}`)
        next(e)
}))
/* Goto Specific Campground Page. Getting the id and rendering it on website */
app.get('/campgrounds/:id', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews')
    // console.log(campground)
    res.render('campgrounds/show', {campground})
}))

app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/edit', {campground})
}))

app.put('/campgrounds/:id', validateCampground, catchAsync(async(req,res) => {
    const {id} = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground})
    res.redirect(`/campgrounds/${campground._id}`)
}))

app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds')
}))

app.post('/campgrounds/:id/reviews', validateReview, catchAsync(async(req, res) => {
    const campground = await Campground.findById(req.params.id)
    const review = new Review(req.body.review)
    campground.reviews.push(review)
    await review.save()
    await campground.save()
    res.redirect(`/Campgrounds/${campground._id}`)
}))

app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async (req, res) => {  /* here */
    const {id, reviewId} = req.params
    await Campground.findByIdAndUpdate(id, {$pull: {reviews: reviewId}})
    await Review.findByIdAndDelete(reviewId)
    res.redirect(`/campgrounds/${id}`)
}))

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
