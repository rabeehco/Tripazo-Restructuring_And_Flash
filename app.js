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

const campgrounds = require('./routes/campgrounds')

const Campground = require('./models/campground')
// const campground = require('./models/campground')

app.engine('ejs', ejsMate)
/* Setting View Engine for EJS */
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views')) 
/* For Parsing The Json Data in Browser */
app.use(express.urlencoded({extended: true}))

app.use(methodOverride('_method'))

const validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body)
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next()
    }
}

app.use('/campgrounds', campgrounds)

/* Render Home.ejs */
app.get('/', (req, res)=>{
    res.render('home')
})


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
