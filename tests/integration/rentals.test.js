const moment = require('moment');
const request = require('supertest');
const { Customer } = require('../../models/customer');
const { Rental } = require('../../models/rental');
const { Movie } = require('../../models/movie');
const { User } = require('../../models/user');
const mongoose = require('mongoose');

describe('/api/rentals', () => {
  let server;

  beforeEach(() => {
    server = require('../../index');
  });
  afterEach(async () => {
    await server.close();
    await Rental.remove({});
    await Movie.remove({});
    await Customer.remove({});
  });

  describe('GET /', () => {
    it('should return all rentals', async () => {
      await Rental.collection.insertMany([
        {
          customer: {
            name: 'customerRental1',
            phone: '12345'
          },
          movie: {
            title: '12345',
            dailyRentalRate: 2
          }
        },
        {
          customer: {
            name: 'customerRental2',
            phone: '12345'
          },
          movie: {
            title: '12345',
            dailyRentalRate: 2
          }
        }
      ]);

      const res = await request(server).get('/api/rentals');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some(r => r.customer.name === 'customerRental1')).toBeTruthy();
      expect(res.body.some(r => r.customer.name === 'customerRental2')).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    it('should return a rental if valid id is passed', async () => {
      const rental = new Rental({
        customer: {
          name: '12345',
          phone: '12345'
        },
        movie: {
          title: '12345',
          dailyRentalRate: 2
        }
      });
      await rental.save();

      const res = await request(server).get('/api/rentals/' + rental._id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('customer');
      expect(res.body).toHaveProperty('movie');
    });

    it('should return 404 if invalid id is passed', async () => {
      const res = await request(server).get('/api/rentals/1');

      expect(res.status).toBe(404);
    });

    it('should return 404 if no rental with the given id exists', async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get('/api/rentals/' + id);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /', () => {
    let customerId;
    let movieId;
    let rental;
    let movie;
    let customer;
    let token;

    const exec = () => {
      return request(server)
        .post('/api/rentals')
        .set('x-auth-token', token)
        .send({ customerId, movieId });
    };

    beforeEach(async () => {
      token = new User().generateAuthToken();

      customerId = mongoose.Types.ObjectId();
      movieId = mongoose.Types.ObjectId();

      customer = new Customer({
        _id: customerId,
        name: '12345',
        phone: '12345'
      });
      await customer.save();

      movie = new Movie({
        _id: movieId,
        title: '12345',
        dailyRentalRate: 2,
        genre: { name: '12345' },
        numberInStock: 10
      });
      await movie.save();

      rental = new Rental({
        customer: {
          _id: customerId,
          name: '12345',
          phone: '12345'
        },
        movie: {
          _id: movieId,
          title: '12345',
          dailyRentalRate: 2
        }
      });
      await rental.save();
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 400 if customerId is not provided', async () => {
      customerId = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if customer with the given id was not found', async () => {
      await Customer.remove({});

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movieId is not provided', async () => {
      movieId = '';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie with the given id was not found', async () => {
      await Movie.remove({});

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie is not in stock', async () => {
      await Movie.remove({});
      const noStockMovie = new Movie({
        _id: movieId,
        title: '12345',
        dailyRentalRate: 2,
        genre: { name: '12345' },
        numberInStock: 0
      });
      await noStockMovie.save();

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 200 if we have a valid request', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
    });

    it('should set the dateOut if input is valid', async () => {
      await exec();

      const rentalInDb = await Rental.findById(rental._id);
      expect(rentalInDb.dateOut).not.toBeNull();
    });

    it('should decrease the movie stock if input is valid', async () => {
      const res = await exec();

      const movieInDb = await Movie.findById(movieId);
      expect(movieInDb.numberInStock).toBe(movie.numberInStock - 1);
    });

    it('should return the rental if input is valid', async () => {
      const res = await exec();

      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['dateOut', 'customer', 'movie'])
      );
    });
  });
});
