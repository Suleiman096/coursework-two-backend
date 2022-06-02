const path = require('path')
const fs = require('fs')
const express = require('express')
const app = express()
const cors = require('cors')

app.use(express.json())
app.use(cors());

// connect to MongoDB
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://sulex:dali123@cluster0.dwbwn.mongodb.net/?retryWrites=true&w=majority"
let db;
MongoClient.connect(url, (err, client) => {
    db = client.db('webstore')
})

// get the collection name
app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName)
    return next()
})

// Logging middleware
app.use(function(req, res, next){
    console.log("Request type: "+req.method)
    console.log("Request url: "+req.url)
    console.log("Request date: "+new Date())
    console.log("Request IP: "+req.ip)
    next()
})

app.get('/', (req, res) => {
    res.send("Welcome to entry point")
})

// Get all lessons
app.get('/collection/:collectionName', (req, res) => {
    req.collection.find({}).toArray((err, results) => {
        if (err) return next(err)
        res.send(results)
    })
})

// Add new order
app.post('/collection/:collectionName', (req, res) => {
    let doc = req.body
    req.collection.insertOne(doc, (err, result) => {
        if (err) return next(err)
        res.send({msg: "order added successfully"})
    })
})

// Update spaces
app.put('/collection/:collectionName', (req, res) => {
    req.body.forEach((item) => {
        let filter = { id: item.id }
        let new_value = { $set: {spaces: item.spaces} }
        let options = { safe: true, multi: false }
        req.collection.updateOne(filter, new_value, options, (err, result) => {
            if (err) return next(err)
        })
    });
    res.send({msg: "spaces successfully updated"})
})

// back end search function
app.get('/collection/:collectionName/filter', (req, res) => {
    let search_keyword = req.query.search
    req.collection.find({}).toArray((err, results) => {
        if (err) return next(err)
        let filteredList = results.filter((lesson) => {
            return lesson.subject.toLowerCase().match(search_keyword.toLowerCase()) || lesson.location.toLowerCase().match(search_keyword.toLowerCase())
        });  
        res.send(filteredList)
    })
})

// Static file middleware
app.use(function(req, res, next){
    var filePath = path.join(__dirname, "static", req.url)
    fs.stat(filePath, function(err, fileInfo){
        if (err) {
            next()
            return
        }
        if (fileInfo.isFile()) {
            res.sendFile(filePath)
        }
        else{
            next()
        }
    })
})

app.use(function(req, res){
    res.status(404)
    res.send("file not found")
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log("Running on port 3000")
})