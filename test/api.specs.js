var request = require('supertest');
var api = require('../Server');


describe('TESTING API HACKTHON', function() {

  describe('GET /api_esgi_hackathon/', function() {
    it('should return welcome message', function() {
      return request(api)
      .get('/api/')
      .send()
      .expect(200);
    });
  });
});
