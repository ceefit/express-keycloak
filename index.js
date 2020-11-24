const AWS = require('aws-sdk');
const Keycloak = require('keycloak-connect');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const multer  = require('multer');
const multerS3 = require('multer-s3')
const session = require('express-session');

AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'dc-demo'});;
const spacesEndpoint = new AWS.Endpoint('ewr1.vultrobjects.com');
s3 = new AWS.S3({apiVersion: '2006-03-01', endpoint: spacesEndpoint});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'dc-demo',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
})

const app = express();
app.use(bodyParser.json());

// Enable CORS support
app.use(cors());

// Create a session-store to be used by both the express-session
// middleware and the keycloak middleware.

const memoryStore = new session.MemoryStore();

app.use(session({
  secret: 'super secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

const keycloak = new Keycloak({
  store: memoryStore
});

app.use(keycloak.middleware({
        logout: '/logout'
    }));

app.get('/', function (req, res) {
  res.send("HOME");
});

app.get('/logout', function (req, res) {
  res.json({message: 'logged out'});
});

app.get('/bucket-list', function (req, res) {
  var params = {
    Bucket: "dc-demo",
    MaxKeys: 25 // The max number of objects to list
  };
  s3.listObjectsV2(params, function(err, data) {
    if (err) {
      res.json({message: 'error', error: err})
    } else {
      res.json({objects: data.Contents});
    }
  });
})

app.post('/bucket-upload', upload.single('selectedAudioFileField'), (req, res, next) => {
  res.send('Successfully uploaded'); // TODO: Some error checking here would be nice
});

app.get('/bucket-download/:key', function (req, res) {
  var key = req.params.key;

  s3.getObject(
      { Bucket: "dc-demo", Key: key },
      function (error, data) {
        if (error != null) {
          res.send("Failed to retrieve an object: " + error);
        } else {
          res.writeHead(200, {
            'Content-Type': 'application/mp3',
            'Content-Disposition': `'attachment; filename=${key}'`,
            'Content-Length': data.Body.length
          });
          res.end(data.Body);
        }
      }
  );
})


app.get('/service/public', function (req, res) {
  res.json({message: 'public'});
});

app.get('/service/secured', keycloak.protect('realm:user'), function (req, res) {
  res.json({message: 'secured'});
});

app.get('/service/admin', keycloak.protect('realm:admin'), function (req, res) {
  res.json({message: 'admin'});
});

// app.use('*', function (req, res) {
//   res.send("404");
// });

app.listen(9000, function () {
  console.log('Started at port 9000');
});