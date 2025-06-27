const mongoose = require('mongoose');

const gpsTrackSchema = new mongoose.Schema({
  imei: { type: String, required: true, unique: true },
  historial: [{
    lon:Number,
    lat:Number,
    course: Number,
    speed: Number,
    timestamp: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('GpsTrack', gpsTrackSchema);
