const request = require('supertest');
const { Movie } = require('../../models/movie');
const { Genre } = require('../../models/genre');
const { User } = require('../../models/user');
const mongoose = require('mongoose');

let server;

describe('/api/movies', () => {
  let genre;

  beforeEach(async () => {
    server = require('../../index');
    genre = new Genre({ name: 'genre1' });
    await genre.save();
  });

  afterEach(async () => {
    await server.close();
    await Movie.remove({});
    await Genre.remove({});
  });

  describe('GET /', () => {
    it('should return all movies', async () => {
      const movie = {
        title: 'movie1',
        genre: {
          _id: genre._id,
          name: genre.name
        },
        numberInStock: 1,
        dailyRentalRate: 1
      };
      const movies = [movie, { ...movie, title: 'movie2' }];
      await Movie.collection.insertMany(movies);

      const res = await request(server).get('/api/movies');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some(m => m.title === 'movie1')).toBeTruthy();
      expect(res.body.some(m => m.title === 'movie2')).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    it('should return a movie if valid id is passed', async () => {
      const movie = new Movie({
        title: 'movie1',
        genre: {
          _id: genre._id,
          name: genre.name
        },
        numberInStock: 1,
        dailyRentalRate: 1
      });
      await movie.save();

      const res = await request(server).get('/api/movies/' + movie._id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('title', movie.title);
    });

    it('should return 404 if invalid id is passed', async () => {
      const res = await request(server).get('/api/movies/1');

      expect(res.status).toBe(404);
    });

    it('should return 404 if no movie with the given id exists', async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get('/api/movies/' + id);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /', () => {
    let token;
    let movie;

    const exec = async () => {
      return await request(server)
        .post('/api/movies')
        .set('x-auth-token', token)
        .send(movie);
    };

    beforeEach(() => {
      token = new User().generateAuthToken();
      movie = {
        title: 'movie1',
        genreId: genre._id,
        numberInStock: 1,
        dailyRentalRate: 1
      };
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 400 if movie.title is less than 5 characters', async () => {
      movie.title = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie.title is more than 255 characters', async () => {
      movie.title = new Array(257).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie.numberInStock is less than 0 characters', async () => {
      movie.numberInStock = -1;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie.numberInStock is more than 255 characters', async () => {
      movie.numberInStock = 256;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie.dailyRentalRate is less than 0 characters', async () => {
      movie.dailyRentalRate = -1;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie.dailyRentalRate is more than 255 characters', async () => {
      movie.dailyRentalRate = 256;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie.genreId id is invalid', async () => {
      movie.genreId = 1;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if genre from the given movie was not found', async () => {
      movie.genreId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should save the movie if it is valid', async () => {
      await exec();

      const movie = await Movie.find({ title: 'movie1' });

      expect(movie).not.toBeNull();
    });

    it('should return the movie if it is valid', async () => {
      const res = await exec();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('title', 'movie1');
    });
  });

  describe('PUT /:id', () => {
    let token;
    let dbMovie;
    let newMovie;
    let id;

    const exec = async () => {
      return await request(server)
        .put('/api/movies/' + id)
        .set('x-auth-token', token)
        .send(newMovie);
    };

    beforeEach(async () => {
      dbMovie = new Movie({
        title: 'movie1',
        genre: {
          _id: genre._id,
          name: genre.name
        },
        numberInStock: 1,
        dailyRentalRate: 1
      });
      await dbMovie.save();

      id = dbMovie._id;

      newMovie = {
        title: 'movie1',
        genreId: genre._id,
        numberInStock: 1,
        dailyRentalRate: 1
      };

      token = new User().generateAuthToken();
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 400 if movie.title is less than 5 characters', async () => {
      newMovie.title = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie.title is more than 255 characters', async () => {
      newMovie.title = new Array(257).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie.numberInStock is less than 0 characters', async () => {
      newMovie.numberInStock = -1;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie.numberInStock is more than 255 characters', async () => {
      newMovie.numberInStock = 256;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie.dailyRentalRate is less than 0 characters', async () => {
      newMovie.dailyRentalRate = -1;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie.dailyRentalRate is more than 255 characters', async () => {
      newMovie.dailyRentalRate = 256;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if movie.genreId id is invalid', async () => {
      newMovie.genreId = 1;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if genre from the given movie was not found', async () => {
      newMovie.genreId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 404 if movie with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should update the movie if input is valid', async () => {
      await exec();

      const updatedmovie = await Movie.findById(dbMovie._id);

      expect(updatedmovie.title).toBe(newMovie.title);
    });

    it('should return the updated movie if it is valid', async () => {
      const res = await exec();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('title', newMovie.title);
    });
  });

  describe('DELETE /:id', () => {
    let token;
    let movie;
    let id;

    const exec = async () => {
      return await request(server)
        .delete('/api/movies/' + id)
        .set('x-auth-token', token)
        .send();
    };

    beforeEach(async () => {
      movie = new Movie({
        title: 'movie1',
        genre: {
          _id: genre._id,
          name: genre.name
        },
        numberInStock: 1,
        dailyRentalRate: 1
      });
      await movie.save();

      id = movie._id;

      token = new User({ isAdmin: true }).generateAuthToken();
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 403 if the user is not an admin', async () => {
      token = new User({ isAdmin: false }).generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 404 if no movie with the given id was found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should delete the movie if input is valid', async () => {
      await exec();

      const movieInDb = await Movie.findById(id);

      expect(movieInDb).toBeNull();
    });

    it('should return the removed movie', async () => {
      const res = await exec();

      expect(res.body).toHaveProperty('_id', movie._id.toHexString());
      expect(res.body).toHaveProperty('title', movie.title);
    });
  });
});
