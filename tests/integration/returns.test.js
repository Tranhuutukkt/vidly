const {Rental} = require("../../models/rental");
const {User} = require("../../models/user");
const mongoose = require('mongoose');
const moment = require('moment');
const request = require('supertest');
const {Movie} = require("../../models/movie");


describe('/api/returns', function () {
    let server;
    let customerId;
    let movieId;
    let rental;
    let token;
    let movie;

    const exec = ()=>{
        return request(server)
            .post('/api/returns')
            .set('x-auth-token', token)
            .send({customerId, movieId});
    }

    beforeEach(async () => {
        server = require('../../index');

        customerId = mongoose.Types.ObjectId();
        movieId = mongoose.Types.ObjectId();
        token = new User().generateAuthToken();

        movie = new Movie({
            _id: movieId,
            title: 'Titanic',
            dailyRentalRate: 2,
            genre: {name: 'Comedy'},
            numberInStock: 10
        });
        await movie.save();

        rental = new Rental({
            customer: {
                _id: customerId,
                name: "Vu Nam",
                phone: "0383073433"
            },
            movie: {
                _id: movieId,
                title: "Titanic",
                dailyRentalRate: 2
            }
        });
        await rental.save();
    });

    afterEach(async function () {
        //await server.close();
        await Rental.remove({});
        await Movie.remove({});
    });

    it('should return 401 if client is not logged in', async function () {
        token = '';
        const res = await exec();
        expect(res.status).toBe(401);
    });

    it('should return 400 if customer id is not provided', async function () {
        customerId = '';
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 400 if movie id is not provided', async function () {
        movieId = '';
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 404 if no rental found for the customer/movie', async function () {
        await Rental.remove({});
        const res = await exec();
        expect(res.status).toBe(404);
    });

    it('should return 400 if return is already processed', async function () {
        rental.dayReturned = new Date();
        await rental.save();

        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 200 if valid request', async function () {
        const res = await exec();
        expect(res.status).toBe(200);
    });

    it('should set the return day if input is valid', async function () {
        await exec();

        const rentalInDb = await Rental.findById(rental._id);
        const diff = new Date() - rentalInDb.dayReturned;
        expect(diff).toBeLessThan(10*1000);
    });

    it('should set the rental fee if input is valid', async function () {
        rental.dateOut = moment().add(-7, 'days').toDate();
        await rental.save();

        await exec();

        const rentalInDb = await Rental.findById(rental._id);
        expect(rentalInDb.rentalFee).toBe(14);
    });

    it('should increase the movie stock if input is valid', async function () {
        await exec();

        const movieInDb = await Movie.findById(movieId);
        expect(movieInDb.numberInStock).toBe(movie.numberInStock + 1);
    });

    it('should return the rental if input is valid', async function () {
        const res = await exec();

        const rentalInDb = await Rental.findById(rental._id);
        expect(Object.keys(res.body)).toEqual(
            expect.arrayContaining(['dateOut', 'dayReturned', 'rentalFee', 'customer']));
    });
});