const path = require('path');
const express = require('express');
const multer  = require('multer');

var session = require('express-session');
var Keycloak = require('keycloak-connect');
var memoryStore = new session.MemoryStore();
var keycloak = new Keycloak({ store: memoryStore });


const upload = multer({ dest: 'dist/uploads/' });
const app = express();
const port = process.env.PORT || 9000;



app.use(express.static(path.join(__dirname, '/dist')));
app.use( keycloak.middleware() );

app.get('/health', (req, res) => {
  res.send("UP");
});

const checkSsoHandler = (req, res) => {
	res.send("checkSSOHandler");
};

const complaintHandler = (req, res) => {
	res.send("complaintHandler");
};

app.get('/check-sso', keycloak.checkSso(), checkSsoHandler);
app.get('/complain', keycloak.protect(), complaintHandler);



app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/dist/index.html'));
});
app.post('/uploadAudio', upload.single('selectedAudioFileField'), (req, res, next) => {
  console.log(req.file);
})
app.listen(port, () => console.log(`Listening on port ${port}`));








