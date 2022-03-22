const express = require('express');
const mongoose = require('mongoose');
const Fawn = require('fawn');
const {Movie} = require('../models/movie');
const {Customer} = require('../models/customer');
const {Rental, validate} = require('../models/rental')
const config = require("config");
const router = express.Router();

//Fawn.init(config.get('db'));

router.get('/', async (req, res) => {
    const rental = await Rental.find().sort('-dateOut');
    res.send(rental);
});

router.post('/', async (req, res) => {
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const customer = await Customer.findById(req.body.customerId);
    if (!customer) return res.status(400).send('Invalid customer!');

    const movie = await Movie.findById(req.body.movieId);
    if (!movie) return res.status(400).send('Invalid movie!');

    if(movie.numberInStock === 0) return res.status(400).send('Movie not in stock!');

    let rental = new Rental({
        customer: {
            _id: customer._id,
            name: customer.name,
            phone: customer.phone
        },
        title: req.body.title,
        movie: {
            _id: movie._id,
            title: movie.title,
            dailyRentalRate: movie.dailyRentalRate
        },
    });

    await rental.save((err) => {
        if (err) return res.status(400).send(`Rental validation failed...\n${err}...`);
    });

    movie.numberInStock--;
    await movie.save(async (err) => {
        if (err) {
            await Rental.findByIdAndDelete(rental._id);
            const message = `Movie validation failed...\n${err}...\n`;
            return res.status(400).send(`${message}Rental canceled...`);
        }

        return res.status(200).send(rental);
    })

    // try {
    //     new Fawn.Task()
    //         .save("rentals", rental)
    //         .update("movies", {_id: movie._id}, {
    //             $inc: {numberInStock: -1}
    //         })
    //         .run();
    //     res.send(rental);
    // }
    // catch (ex){
    //     res.status(500).send("Something failed!...");
    //}

});

// router.put('/:id', async (req, res) => {
//     const {error} = validate(req.body);
//     if (error) return res.status(400).send(error.details[0].message);
//
//     const movie = await Movie.findByIdAndUpdate(req.params.id, {name: req.body.name}, {new: true});
//     if (!movie) return res.status(404).send('Not found');
//
//     res.send(movie);
// });
//
// router.delete('/:id', async (req, res) => {
//     const movie = await Movie.findByIdAndRemove(req.params.id);
//
//     if (!movie) return res.status(404).send('Not found');
//
//     res.send(movie);
// });
//
// router.get('/:id', async (req, res) => {
//     const movie = await Movie.findById(req.params.id);
//     if (!movie) return res.status(404).send('Not found');
//
//     res.send(movie);
// });


module.exports = router;