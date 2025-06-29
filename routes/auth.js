const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../src/modules/user");

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "clave_secreta";

// Registro
router.post("/register", async (req, res) => {
  const { email, password, nombre } = req.body;

  console.log(this.nombre)
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, nombre, password: hashed });
    await user.save();
    res.status(201).json({ success: true, message: "Usuario registrado" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, error: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, error: "Contraseña incorrecta" });

    const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: "1h" });
    res.json({ success: true, token, user });
   res.render("index.ejs", { user, token });
  } catch (err) {
    res.status(500).json({ success: false, error: "Error interno" });
  }
});

module.exports = router;
