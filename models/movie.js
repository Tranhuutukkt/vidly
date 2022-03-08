const mongoose = require("mongoose");
const Joi = require("joi");
const {genreSchema} = require('./genre')

const Movie = mongoose.model('Movies', new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 250,
        trim: true
    },
    genre: {
        type: genreSchema,
        required: true,
    },
    numberInStock: {
        type: Number,
        required: true,
        min: 0
    },
    dailyRentalRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    }
}));

function validateMovie(movie) {
    const schema = Joi.object({
        title: Joi.string().min(1).max(250).required(),
        genreId: Joi.objectId().required(),
        numberInStock: Joi.number().min(0).required(),
        dailyRentalRate: Joi.number().min(0).required()
        });
    return schema.validate(movie);
}

exports.Movie = Movie;
exports.validate = validateMovie;