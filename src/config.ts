import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 9302;

app.use(bodyParser.json());

app.post('/postconfig', (req, res) => {
  const configData = req.body.config;
  if (configData) {
    const configPath = path.resolve('./config/received_config.json');
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    res.status(200).send('Config received and saved.');
  } else {
    res.status(400).send('Invalid config data.');
  }
});

export function configServer() {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
