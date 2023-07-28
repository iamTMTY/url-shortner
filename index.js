require('dotenv').config();
const express = require('express');
const dotenv = require("dotenv");
const dns = require('dns');
const cors = require('cors');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const app = express();
mongoose.connect("mongodb+srv://devDB:dev@cluster0.lkqf3uh.mongodb.net/")

const URLDATA = mongoose.model('URLDATA', {short_url: String, original_url: String})

dotenv.config();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

const generateShortUrl = (length=5) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

app.post('/api/shorturl', async function(req, res) {
  const url = req.body?.url
  const https = url?.split("https://").length === 2 ? url?.split("https://")[1] : ""
  const http = url?.split("http://").length === 2 ? url?.split("http://")[1] : ""
  if(https || http) {
    dns.lookup(url?.split("https://")?.[1]?.split("http://")?.[1] || "", {family: 0}, async (err) => {
      if(err) {
        res.json({error: "Invalid URL"})
      } else {
        let body = await URLDATA.findOne({original_url: url})
        if(!body) {
          body = {original_url: url, short_url: generateShortUrl()}
          await URLDATA.create({original_url: body?.original_url, short_url: body?.short_url})
        }
        res.json({original_url: body?.original_url, short_url: body?.short_url});
      }
    })
  } else {
    res.json({error: "Invalid URL"})
  }
});

app.get('/api/shorturl/:short_url', async function(req, res) {
  const short_url = req.params?.short_url
  const data = await URLDATA.findOne({short_url})
  if(data) {
    res.redirect(data.original_url)
  } else {
    res.json({error: "No short URL found for the given input"})
  }

})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
