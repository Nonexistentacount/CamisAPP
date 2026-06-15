const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const app = express();

// Servir archivos estáticos desde la carpeta del proyecto
app.use(express.static(__dirname));
app.use(express.json());

const conectarBD = require('./conexion');
const Usuario = require('./esquemaUsuarios');

async function iniciarServidor() {
  await conectarBD();
}
iniciarServidor();

// ─── RUTA PRINCIPAL ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Camisa.html'));
});

// ─── AUTH: REGISTRO ──────────────────────────────────────────────────────────
app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, email, clave } = req.body;

    if (!nombre || !email || !clave) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    if (clave.length < 4) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }

    const hash = await bcrypt.hash(clave, 10);
    const nuevo = new Usuario({ nombre, email, clave: hash });
    const guardado = await nuevo.save();

    res.status(201).json({
      mensaje: 'Cuenta creada exitosamente',
      usuario: { id: guardado._id, nombre: guardado.nombre, email: guardado.email }
    });
  } catch (error) {
    console.error('Error en registro:', error.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ─── AUTH: LOGIN ─────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { email, clave } = req.body;

    if (!email || !clave) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const claveOk = await bcrypt.compare(clave, usuario.clave);
    if (!claveOk) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    res.json({
      mensaje: 'Sesión iniciada',
      usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email }
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ─── CRUD USUARIOS ───────────────────────────────────────────────────────────
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find({}, '-clave');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id, '-clave');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const datos = req.body;
    if (datos.clave) {
      datos.clave = await bcrypt.hash(datos.clave, 10);
    }
    const actualizado = await Usuario.findByIdAndUpdate(req.params.id, datos, { new: true });
    if (!actualizado) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar usuario' });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const eliminado = await Usuario.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ─── SERVIDOR ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
