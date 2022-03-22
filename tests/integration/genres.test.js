const request = require('supertest');
const mongoose = require('mongoose');
const {Genre} = require('../../models/genre');
const {User} = require('../../models/user');


let server;

describe('/api/genres', ()=>{
    beforeEach(() => {
        server = require('../../index');
    });
    afterEach(async function () {
        await Genre.remove({});
        await server.close();
    });

    describe('GET /', function () {
        it('should return all genres', async function () {
            await Genre.collection.insertMany([
                {name: 'genre1'},
                {name: 'genre2'},
            ]);

            const res = await request(server).get('/api/genres');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(g => g.name === 'genre1')).toBeTruthy();
            expect(res.body.some(g => g.name === 'genre2')).toBeTruthy();
        });
    });

    describe('GET /:id', function () {
        it('should return a genre if valid id is passed', async function () {
            const genre = new Genre({name: 'genre1'});
            await genre.save();

            const res = await request(server).get('/api/genres/' + genre._id);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', genre.name);
        });

        it('should return 404 if invalid id is passed', async function () {
            const res = await request(server).get('/api/genres/1');

            expect(res.status).toBe(404);
        });

        it('should return 404 if no genre with the given id exists', async function () {
            const id = mongoose.Types.ObjectId();
            const res = await request(server).get('/api/genres/' + id);

            expect(res.status).toBe(404);
        });
    });

    describe('POST /', ()=>{
        //Define the happy path
        let token;
        let name;

        const exec = async ()=>{
            return await request(server)
                .post('/api/genres')
                .set('x-auth-token', token)
                .send({name});
        }

        beforeEach(()=>{
            token = new User().generateAuthToken();
            name = 'genre1';
        })

        it('should return 401 if client is not logged in', async function () {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if genre is invalid (less than 3 characters)', async function () {
            name = '12';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if genre is invalid (more than 50 characters)', async function () {
            name = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should save the genre if genre is valid', async function () {
            await exec();

            const genre = await Genre.find({name: 'genre1'});

            expect(genre).not.toBeNull();
        });

        it('should return the genre if genre is valid', async function () {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'genre1');
        });
    });

    describe('PUT /:id', ()=>{
        //Define the happy path
        let token;
        let name;
        let objectId;

        const exec = async ()=>{
            return await request(server)
                .put('/api/genres/' + objectId)
                .set('x-auth-token', token)
                .send({name: name});
        }

        beforeEach(()=>{
            token = new User({isAdmin: true}).generateAuthToken();
            name = 'updated genre';
            objectId = mongoose.Types.ObjectId();
        })

        it('should return 400 if updated genre is invalid (less than 3 characters)', async function () {
            name = '12';
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 400 if updated genre is invalid (more than 50 characters)', async function () {
            name = new Array(52).join('a');
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it("should return 404 error if we supply an invalid object id parameter", async () => {
            objectId = "0123456789ab";
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it("should return 404 error if we supply a valid objectId that does not belong to any existing genre", async () => {
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it('should return the updated genre if successful', async function () {
            const genre = new Genre({name: 'genre1', _id: objectId});
            genre.save();

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                _id: genre._id.toHexString(),
                name: 'updated genre'
            });
        });

    });

    describe("DELETE /:id", () => {
        let token;
        let objectId = "";

        beforeEach(() => {
            token = new User({ isAdmin: true }).generateAuthToken();
        });

        const exec = () => {
            return request(server)
                .delete('/api/genres/' + objectId)
                .set("x-auth-token", token);
        };

        it("should return 404 error if object id is invalid", async () => {
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it("should return 404 error if we supply a valid objectId that does not belong to any existing genre", async () => {
            objectId = new mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });

        it("should return the deleted genre if the delete was successful", async () => {
            objectId = new mongoose.Types.ObjectId();
            const genre = {
                _id: objectId.toHexString(),
                name: "genre1"
            };
            await new Genre(genre).save();

            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject(genre);
        });
    });
});

