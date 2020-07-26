const express = require('express')
var cors = require('cors');
const app = express()
const routes = require('./api/routes/apis')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');

// mongodb+srv://zarrr98:95243045@areas-fpjal.gcp.mongodb.net/PRMDB?retryWrites=true&w=majority
mongoose.connect("mongodb://zarrr98:95243045@areas-shard-00-00-fpjal.gcp.mongodb.net:27017,areas-shard-00-01-fpjal.gcp.mongodb.net:27017,areas-shard-00-02-fpjal.gcp.mongodb.net:27017/PRMDB?ssl=true&replicaSet=Areas-shard-0&authSource=admin&retryWrites=true&w=majority",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
app.use(cors({credentials: true, origin: 'http://localhost:3000', optionsSuccessStatus: 200 }));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/api', routes)
app.use((req, res, next) => {
    const error = new Error('Not Found')
    error.status = 404
    next(error)
})
app.use((error, req, res, next) => {
    res.status(error.status || 500)
    res.json({
        error: {
            message: error.message
        }
    })
});

module.exports = app