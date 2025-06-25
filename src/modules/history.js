const mongoose = require('mongoose');

const gpsTrackSchema = new mongoose.Schema({
  imei: { type: String, required: true, unique: true },
  historial: [{
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [lon, lat]
        required: true
      }
    },
    course: Number,
    speed: Number,
    timestamp: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('GpsTrack', gpsTrackSchema);
