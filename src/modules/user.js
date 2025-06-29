const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nombre: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dispositivos: [{ type: String }] // lista de IMEIs asignados
});

module.exports = mongoose.model("User", userSchema);
