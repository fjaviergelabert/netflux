const { Genre } = require('./models/genre');
const { Movie } = require('./models/movie');
const { Rental } = require('./models/rental');
const { User } = require('./models/user');
const { Customer } = require('./models/customer');
const mongoose = require('mongoose');
const config = require('config');
const bcrypt = require('bcrypt');

const users = [
  {
    name: 'Admin',
    email: 'admin@admin.com',
    password: '12345',
    isAdmin: true
  },
  {
    name: 'Guest',
    email: 'guest@guest.com',
    password: '12345'
  }
];

const data = [
  {
    name: 'Comedy',
    movies: [
      { title: 'Airplane', numberInStock: 5, dailyRentalRate: 2 },
      { title: 'The Hangover', numberInStock: 10, dailyRentalRate: 2 },
      { title: 'Wedding Crashers', numberInStock: 15, dailyRentalRate: 2 }
    ]
  },
  {
    name: 'Action',
    movies: [
      { title: 'Die Hard', numberInStock: 5, dailyRentalRate: 2 },
      { title: 'Terminator', numberInStock: 10, dailyRentalRate: 2 },
      { title: 'The Avengers', numberInStock: 15, dailyRentalRate: 2 }
    ]
  },
  {
    name: 'Romance',
    movies: [
      { title: 'The Notebook', numberInStock: 5, dailyRentalRate: 2 },
      { title: 'When Harry Met Sally', numberInStock: 10, dailyRentalRate: 2 },
      { title: 'Pretty Woman', numberInStock: 15, dailyRentalRate: 2 }
    ]
  },
  {
    name: 'Thriller',
    movies: [
      { title: 'The Sixth Sense', numberInStock: 5, dailyRentalRate: 2 },
      { title: 'Gone Girl', numberInStock: 10, dailyRentalRate: 2 },
      { title: 'The Others', numberInStock: 15, dailyRentalRate: 2 }
    ]
  }
];

async function seed() {
  await mongoose.connect(config.get('db'));

  await Rental.deleteMany({});
  await Movie.deleteMany({});
  await Genre.deleteMany({});
  await Customer.deleteMany({});
  await User.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  for (const user of users) {
    user.password = await bcrypt.hash(user.password, salt);
    await new User(user).save();
  }

  for (let genre of data) {
    const { _id: genreId } = await new Genre({ name: genre.name }).save();
    const movies = genre.movies.map(movie => ({
      ...movie,
      genre: { _id: genreId, name: genre.name }
    }));
    await Movie.insertMany(movies);
  }

  mongoose.disconnect();

  console.info('Database cleaned and populated!');
}

seed();
