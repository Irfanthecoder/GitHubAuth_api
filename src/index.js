const express = require("express");
const { v4: uuidv4 } = require('uuid');
const router = require("./router");
const bodyParser = require("body-parser");
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');


const app = express();
app.use(bodyParser.json());

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

app.use((req, res, next) => {
    req.headers['x-request-id'] = uuidv4();
    next();
});

app.use(morgan('combined', { stream: accessLogStream }));

app.use('/v1', router);

app.listen(4000, () => console.log("Server started"));