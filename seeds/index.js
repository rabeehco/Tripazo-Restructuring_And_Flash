const mongoose = require('mongoose')
const cities = require('./cities')
const {places, descriptors} = require('./seedHelpers')
const Campground = require('../models/campground')
mongoose.connect('mongodb://127.0.0.1:/yelp-camp')
.then(()=>{
    console.log('DB connected')
})

// const sample = array => { // When I code this I got 'undefined' in title field on mongodb
//     array[Math.floor(Math.random() * array.length)] 
// }

const sample = array => array[Math.floor(Math.random() * array.length)];


const seedDB = async () => {
    await Campground.deleteMany({});
    for(let i=0; i<50; i++){
        const random1000 = Math.floor(Math.random() * 1000)
        const price = Math.floor(Math.random() * 20) + 10
        const camp = new Campground({
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            image: 'https://source.unsplash.com/collection/483251',
            description: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ratione, repellendus. Neque iste qui ratione omnis facilis similique cumque, ipsum sunt quis commodi excepturi accusamus nobis, eius nisi vitae corporis iure.',
            price 
        })
        await camp.save()
    }
}

seedDB().then(() => {
    mongoose.connection.close()
})    