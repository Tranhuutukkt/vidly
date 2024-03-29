const mongoose = require("mongoose");
const Joi = require("joi");
const moment = require("moment");
Joi.objectId = require('joi-objectid')(Joi);

const rentalSchema = new mongoose.Schema({
    customer: {
        type: new mongoose.Schema({
            name: {
                type: String,
                required: true,
                minlength: 3,
                maxlength: 50
            },
            isGold: {
                type: Boolean,
                default: false
            },
            phone: {
                type: String,
                minlength: 10,
                maxlength: 20,
                required: true
            }
        }),
        required: true
    },
    movie: {
        type: new mongoose.Schema({
            title: {
                type: String,
                required: true,
                minlength: 1,
                maxlength: 250,
                trim: true
            },
            dailyRentalRate: {
                type: Number,
                required: true,
                min: 0,
                max: 100
            }
        }),
        required: true
    },
    dateOut:{
        type: Date,
        required: true,
        default: Date.now()
    },
    dayReturned: {
        type: Date
    },
    rentalFee: {
        type: Number,
        min: 0
    }
});

rentalSchema.statics.lookup = function (customerId, movieId){
    return this.findOne({
        'customer._id': customerId,
        'movie._id': movieId
    });
}

rentalSchema.methods.return = function (){
    this.dayReturned = new Date();
    this.rentalFee = moment().diff(this.dateOut, 'days')*this.movie.dailyRentalRate;
}

const Rental = mongoose.model('Rental', rentalSchema);

function validateRental(rental) {
    const schema = Joi.object({
        customerId: Joi.objectId().required(),
        movieId: Joi.objectId().required()
    });
    return schema.validate(rental);
}

module.exports.Rental = Rental;
module.exports.validate = validateRental;