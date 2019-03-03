# Netflux
Simple Movie Rental store project. RESTful API built with Node, Express, and MongoDB.

Project setup:
  1. Install Node (Node version used for this project: 10.14.2).
  2. Run npm install.
  3. Define "netflux_db" environment variable with a connection string to an existant MongoDB. Or just define the value of the key "db" in the /config/default.json file.
  4. Run npm start.

Run "npm test" if you want to run the tests for the project, or "npm run test-coverage" to get a html file (directory that will be used: /coverage/lcov-report/index.html) and a table of the test coverage in the console.

Live demo: https://netflux-demo.herokuapp.com/api/movies  
API documentation: https://documenter.getpostman.com/view/6787528/S11KNHgz
