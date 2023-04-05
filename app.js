const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const moment = require('moment');
const mongoose = require('mongoose');
const fs = require('fs')

const User = require('./models/user');
mongoose.connect('mongodb://127.0.0.1:27017/myDatabase', { useNewUrlParser: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
    });

const app = express();


const upload = multer({ dest: 'uploads/' });


app.post('/upload', upload.single('file'), (req, res) => {

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }


    if (req.file.mimetype !== 'text/csv') {
        return res.status(400).json({ error: 'Invalid file format. Please upload a CSV file' });
    }


    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
            results.push(data);
        })
        .on('end', () => {
            // Process the parsed CSV data
            const importedRecords = [];
            const invalidRecords = [];


            for (const record of results) {

                if (!record.Identity || !record.Matches || !record.Rank || !record.Place || !record.Registration) {
                    invalidRecords.push(record);
                    continue;
                }


                const identity = parseInt(record.Identity);
                const matches = parseInt(record.Matches);
                const rank = parseInt(record.Rank);
                const place = record.Place;
                const registration = moment(record.Registration);



                // Skip record if registration date is in the future
                if (registration.isAfter(moment())) {
                    invalidRecords.push(record);
                    continue;
                }

                // Check if identity exists in database, and skip record if not found
                User.findOne({ id: identity }).exec(function (err, user) {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    if (!user) {
                        invalidRecords.push(record);
                        return;
                    }

                    // Create a new record in the database
                    const newRecord = new U({
                        identity: user.id,
                        matches: matches,
                        rank: rank,
                        place: place,
                        registration: registration
                    });

                    // Save the new record to the database
                    newRecord.save((err) => {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        importedRecords.push(record);

                        // Check if all records have been processed
                        if (importedRecords.length + invalidRecords.length === results.length) {
                            // Create a notification in the database with the import summary
                            const notification = new Notification({
                                importedRecords: importedRecords.length,
                                invalidRecords: invalidRecords.length
                            });
                            notification.save((err) => {
                                if (err) {
                                    console.error(err);
                                    return;
                                }

                                // Return the import summary in the API response
                                return res.json({
                                    message: 'CSV import completed',
                                    importedRecords: importedRecords.length,
                                    invalidRecords: invalidRecords.length
                                });
                            });
                        }
                    });
                });

            }
        });


});

app.listen(3000, () => {
    console.log("The server is up at port 3000")
})
