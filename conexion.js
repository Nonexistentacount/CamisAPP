const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017';

async function conectarBD() {
try {
await mongoose.connect(uri);
console.log('Conectado correctamente a MongoDB Atlas con Mongoose');
} catch (error) {
console.log('Error conectando con Mongoose:', error.message);
}
}

module.exports = conectarBD;