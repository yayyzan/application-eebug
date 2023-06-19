const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'new_password',
  database: 'eebugdb',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

app.get('/records', (req, res) => {
  connection.query('SELECT * FROM eebugtable', (err, results) => {
    if (err) {
      console.error('Error fetching records:', err);
      res.status(500).json({ error: 'Error fetching records' });
      return;
    }

    const recordsWithDecodedImages = results.map((record) => {
      const decodedImage = Buffer.from(record.image, 'base64').toString('binary');
      return { ...record, image: decodedImage };
    });
    
    res.json(recordsWithDecodedImages);
  });
});

app.post('/records', (req, res) => {
  const { id, image, date_field } = req.body;
  if(id){
    connection.query(
      'INSERT INTO eebugtable (id, image, date_field) VALUES (?, ?, ?)',
      [id, image, date_field],
      (err, results) => {
        if (err) {
          console.error('Error adding record:', err);
          res.status(500).json({ error: 'Error adding record' });
          return;
        }
        res.json({ message: 'Record added successfully' });
    }
  );
  }
});

app.delete('/records/:id', (req, res) => {
  const id = req.params.id;

  connection.query(
    'DELETE FROM eebugtable WHERE id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('Error deleting record:', err);
        res.status(500).json({ error: 'Error deleting record' });
        return;
      }
      if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Record not found' });
        return;
      }
      res.json({ message: 'Record deleted successfully' });
    }
  );
});

app.listen(3001, () => {
  console.log('Server started on port 3001');
});