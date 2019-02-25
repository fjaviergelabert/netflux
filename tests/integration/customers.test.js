const request = require('supertest');
const { Customer } = require('../../models/customer');
const { User } = require('../../models/user');
const mongoose = require('mongoose');

let server;

describe('/api/customers', () => {
  beforeEach(() => {
    server = require('../../index');
  });
  afterEach(async () => {
    await server.close();
    await Customer.remove({});
  });

  describe('GET /', () => {
    it('should return all customers', async () => {
      const customers = [
        { name: 'customer1', phone: '12345' },
        { name: 'customer2', phone: '12345' }
      ];
      await Customer.collection.insertMany(customers);

      const res = await request(server).get('/api/customers');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some(c => c.name === 'customer1')).toBeTruthy();
      expect(res.body.some(c => c.name === 'customer2')).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    it('should return a customer if valid id is passed', async () => {
      const customer = new Customer({ name: 'customer1', phone: '12345' });
      await customer.save();

      const res = await request(server).get('/api/customers/' + customer._id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', customer.name);
    });

    it('should return 404 if invalid id is passed', async () => {
      const res = await request(server).get('/api/customers/1');

      expect(res.status).toBe(404);
    });

    it('should return 404 if no customer with the given id exists', async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get('/api/customers/' + id);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /', () => {
    let token;
    let name;
    let phone;

    const exec = async () => {
      return await request(server)
        .post('/api/customers')
        .set('x-auth-token', token)
        .send({ name, phone });
    };

    beforeEach(() => {
      token = new User().generateAuthToken();
      name = 'customer1';
      phone = '12345';
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 400 if customer is less than 5 characters', async () => {
      name = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if customer is more than 50 characters', async () => {
      name = new Array(52).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if phone is less than 5 characters', async () => {
      phone = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if phone is more than 50 characters', async () => {
      phone = new Array(52).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should save the customer if it is valid', async () => {
      await exec();

      const customer = await Customer.find({ name: 'customer1' });

      expect(customer).not.toBeNull();
    });

    it('should return the customer if it is valid', async () => {
      const res = await exec();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name', 'customer1');
    });
  });

  describe('PUT /:id', () => {
    let token;
    let newName;
    let newPhone;
    let customer;
    let id;

    const exec = async () => {
      return await request(server)
        .put('/api/customers/' + id)
        .set('x-auth-token', token)
        .send({ name: newName, phone: newPhone });
    };

    beforeEach(async () => {
      customer = new Customer({ name: 'customer1', phone: '12345' });
      await customer.save();

      token = new User().generateAuthToken();
      id = customer._id;
      newName = 'updatedName';
      newPhone = '123456';
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 400 if customer is less than 5 characters', async () => {
      newName = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if customer is more than 50 characters', async () => {
      newName = new Array(52).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if phone is less than 5 characters', async () => {
      newPhone = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if phone is more than 50 characters', async () => {
      newPhone = new Array(52).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should return 404 if customer with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should update the customer if input is valid', async () => {
      await exec();

      const updatedcustomer = await Customer.findById(customer._id);

      expect(updatedcustomer.name).toBe(newName);
    });

    it('should return the updated customer if it is valid', async () => {
      const res = await exec();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name', newName);
    });
  });

  describe('DELETE /:id', () => {
    let token;
    let customer;
    let id;

    const exec = async () => {
      return await request(server)
        .delete('/api/customers/' + id)
        .set('x-auth-token', token)
        .send();
    };

    beforeEach(async () => {
      customer = new Customer({ name: 'customer1', phone: '12345' });
      await customer.save();

      id = customer._id;
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

    it('should return 404 if no customer with the given id was found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it('should delete the customer if input is valid', async () => {
      await exec();

      const customerInDb = await Customer.findById(id);

      expect(customerInDb).toBeNull();
    });

    it('should return the removed customer', async () => {
      const res = await exec();

      expect(res.body).toHaveProperty('_id', customer._id.toHexString());
      expect(res.body).toHaveProperty('name', customer.name);
    });
  });
});
