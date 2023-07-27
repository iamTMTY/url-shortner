require('dotenv').config();
const express = require('express');
const dns = require('dns');
const fs = require('fs')
const cors = require('cors');
const bodyParser = require('body-parser')
const app = express();
const db = require("./db.json")

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

const getUrl = (url) => db.find(data => data.original_url === url)

const saveUrl = (data) => {
  let result = data
  fs.writeFile('db.json', JSON.stringify([...db, data]), (err) => {
    if(err) {
      result = "Invalid URL"
    }
  })

  return result
}

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

app.post('/api/shorturl', function(req, res) {
  const url = req.body?.url
  const https = url?.split("https://").length === 2 ? url?.split("https://")[1] : ""
  const http = url?.split("http://").length === 2 ? url?.split("http://")[1] : ""
  if(https || http) {
    dns.lookup(url?.split("https://")?.[1]?.split("http://")?.[1] || "", {family: 0}, (err, address) => {
      if(err) {
        res.json({error: "Invalid URL"})
      } else {
        const data = getUrl(url)
        const body = data || saveUrl({original_url: url, short_url: generateShortUrl()})
        res.json({body});
      }
    })
  } else {
    res.json({error: "Invalid URL"})
  }
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const short_url = req.params?.short_url
  const data = db.find(data => data.short_url === short_url)
  if(data) {
    res.redirect(data.original_url)
  } else {
    res.json({error: "No short URL found for the given input"})
  }

})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
