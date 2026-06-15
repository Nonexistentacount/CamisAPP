// ─── ESTADO GLOBAL ────────────────────────────────────────────────────────────
let usuarioActual = null;
let disenos = [];
let parteSeleccionada = null;
let modoEdicion = false;

const coloresBase = {
  torso: '#E8E3D6',
  mangaIzquierda: '#E8E3D6',
  mangaDerecha: '#E8E3D6',
  cuello: '#E8E3D6'
};

let coloresActuales = { ...coloresBase };

// ─── PERSISTENCIA SESIÓN ──────────────────────────────────────────────────────
function guardarSesion(usuario) {
  localStorage.setItem('sesionUsuario', JSON.stringify(usuario));
}
function cargarSesion() {
  const data = localStorage.getItem('sesionUsuario');
  return data ? JSON.parse(data) : null;
}
function borrarSesion() {
  localStorage.removeItem('sesionUsuario');
}

// ─── HELPERS UI ───────────────────────────────────────────────────────────────
function mostrar(id)  { document.getElementById(id)?.classList.remove('oculto'); }
function ocultar(id) { document.getElementById(id)?.classList.add('oculto'); }

function toast(icono, titulo, texto = '') {
  Swal.fire({
    icon: icono,
    title: titulo,
    text: texto,
    timer: 2200,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
    timerProgressBar: true
  });
}

// ─── PANTALLAS ────────────────────────────────────────────────────────────────
function mostrarApp(usuario) {
  usuarioActual = usuario;
  guardarSesion(usuario);

  ocultar('pantallaAuth');
  mostrar('pantallaApp');

  document.getElementById('perfilNombre').textContent = usuario.nombre;
  document.getElementById('perfilEmail').textContent   = usuario.email;

  const avatar = document.getElementById('avatarUsuario');
  const avatarGuardado = localStorage.getItem(`avatar_${usuario.id}`);
  avatar.src = avatarGuardado || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nombre)}&background=3F5D44&color=fff&size=90&rounded=true`;

  cargarDisenos();
}

function mostrarAuth() {
  usuarioActual = null;
  borrarSesion();
  mostrar('pantallaAuth');
  ocultar('pantallaApp');
  document.getElementById('loginEmail').value   = '';
  document.getElementById('loginClave').value   = '';
  document.getElementById('registroNombre').value = '';
  document.getElementById('registroEmail').value  = '';
  document.getElementById('registroClave').value  = '';
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
document.getElementById('tabLogin').addEventListener('click', () => {
  mostrar('formLogin');  ocultar('formRegistro');
  document.getElementById('tabLogin').classList.add('activo');
  document.getElementById('tabRegistro').classList.remove('activo');
});
document.getElementById('tabRegistro').addEventListener('click', () => {
  ocultar('formLogin');  mostrar('formRegistro');
  document.getElementById('tabRegistro').classList.add('activo');
  document.getElementById('tabLogin').classList.remove('activo');
});

// ─── REGISTRO ─────────────────────────────────────────────────────────────────
document.getElementById('btnRegistro').addEventListener('click', async () => {
  const nombre = document.getElementById('registroNombre').value.trim();
  const email  = document.getElementById('registroEmail').value.trim();
  const clave  = document.getElementById('registroClave').value;

  if (!nombre || !email || !clave) {
    return toast('warning', 'Completa todos los campos');
  }

  const btn = document.getElementById('btnRegistro');
  btn.disabled = true;
  btn.textContent = 'Creando cuenta...';

  try {
    const res = await fetch('/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, clave })
    });
    const data = await res.json();

    if (!res.ok) {
      toast('error', data.error || 'Error al registrarse');
    } else {
      toast('success', '¡Cuenta creada!', 'Ahora inicia sesión');
      // Cambiar a tab login y pre-llenar email
      document.getElementById('tabLogin').click();
      document.getElementById('loginEmail').value = email;
    }
  } catch {
    toast('error', 'No se pudo conectar con el servidor');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Crear cuenta →';
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
document.getElementById('btnLogin').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const clave  = document.getElementById('loginClave').value;

  if (!email || !clave) {
    return toast('warning', 'Ingresa tu correo y contraseña');
  }

  const btn = document.getElementById('btnLogin');
  btn.disabled = true;
  btn.textContent = 'Entrando...';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, clave })
    });
    const data = await res.json();

    if (!res.ok) {
      toast('error', data.error || 'Credenciales incorrectas');
    } else {
      mostrarApp(data.usuario);
    }
  } catch {
    toast('error', 'No se pudo conectar con el servidor');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Iniciar sesión →';
  }
});

// Enter en inputs de auth
['loginEmail','loginClave'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btnLogin').click();
  });
});
['registroNombre','registroEmail','registroClave'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btnRegistro').click();
  });
});

// ─── LOGOUT / CAMBIAR CUENTA ─────────────────────────────────────────────────
document.getElementById('btnLogout').addEventListener('click', async () => {
  const confirm = await Swal.fire({
    title: '¿Cerrar sesión?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, salir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#991b1b'
  });
  if (confirm.isConfirmed) mostrarAuth();
});

document.getElementById('btnCambiarCuenta').addEventListener('click', () => mostrarAuth());

// ─── AVATAR ───────────────────────────────────────────────────────────────────
document.getElementById('inputAvatar').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const dataUrl = ev.target.result;
    document.getElementById('avatarUsuario').src = dataUrl;
    if (usuarioActual) localStorage.setItem(`avatar_${usuarioActual.id}`, dataUrl);
    toast('success', 'Foto actualizada');
  };
  reader.readAsDataURL(file);
});

// ─── CAMISETA SVG ─────────────────────────────────────────────────────────────
const partes = document.querySelectorAll('.parte-camiseta');

partes.forEach(parte => {
  parte.style.cursor = 'pointer';
  parte.addEventListener('click', () => {
    parteSeleccionada = parte.id;
    const nombres = {
      torso: 'Torso',
      mangaIzquierda: 'Manga izquierda',
      mangaDerecha: 'Manga derecha',
      cuello: 'Cuello'
    };
    document.getElementById('parteActual').textContent = `✏️ Editando: ${nombres[parte.id] || parte.id}`;
    document.getElementById('colorPicker').value = coloresActuales[parte.id] || '#E8E3D6';
    // highlight
    partes.forEach(p => p.style.opacity = '0.7');
    parte.style.opacity = '1';
    parte.style.filter = 'drop-shadow(0 0 6px rgba(37,99,235,0.5))';
    setTimeout(() => {
      partes.forEach(p => { p.style.opacity = ''; p.style.filter = ''; });
    }, 800);
  });
});

document.getElementById('colorPicker').addEventListener('input', e => {
  if (!parteSeleccionada) {
    toast('info', 'Selecciona una parte de la camiseta primero');
    return;
  }
  const color = e.target.value;
  coloresActuales[parteSeleccionada] = color;
  document.getElementById(parteSeleccionada).setAttribute('fill', color);
});

document.getElementById('btnLimpiar').addEventListener('click', () => {
  coloresActuales = { ...coloresBase };
  Object.keys(coloresBase).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('fill', coloresBase[id]);
  });
  parteSeleccionada = null;
  document.getElementById('parteActual').textContent = '🔍 Selecciona una parte de la camiseta';
  toast('success', 'Colores reiniciados');
});

// ─── DISEÑOS (localStorage como BD local) ─────────────────────────────────────
function cargarDisenos() {
  const raw = localStorage.getItem('disenos_gen2027');
  disenos = raw ? JSON.parse(raw) : [];
  renderizarDisenos();
  actualizarEstadisticas();
}

function guardarDisenos() {
  localStorage.setItem('disenos_gen2027', JSON.stringify(disenos));
}

document.getElementById('btnGuardar').addEventListener('click', () => {
  const nombre = document.getElementById('nombreDiseno').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();

  if (!nombre) return toast('warning', 'Ponle un nombre a tu diseño');

  const diseno = {
    id: Date.now().toString(),
    nombre,
    descripcion,
    colores: { ...coloresActuales },
    autorId: usuarioActual.id,
    autorNombre: usuarioActual.nombre,
    votos: [],
    fecha: new Date().toLocaleDateString('es-CR')
  };

  disenos.unshift(diseno);
  guardarDisenos();
  renderizarDisenos();
  actualizarEstadisticas();

  document.getElementById('nombreDiseno').value = '';
  document.getElementById('descripcion').value  = '';
  toast('success', '¡Diseño guardado!');
});

// ─── EDICIÓN ─────────────────────────────────────────────────────────────────
function iniciarEdicion(id) {
  const diseno = disenos.find(d => d.id === id);
  if (!diseno) return;

  modoEdicion = true;
  document.getElementById('camisetaId').value     = id;
  document.getElementById('nombreDiseno').value   = diseno.nombre;
  document.getElementById('descripcion').value    = diseno.descripcion;
  coloresActuales = { ...diseno.colores };

  Object.keys(coloresActuales).forEach(parte => {
    const el = document.getElementById(parte);
    if (el) el.setAttribute('fill', coloresActuales[parte]);
  });

  ocultar('btnGuardar');
  mostrar('btnActualizar');
  mostrar('btnCancelar');
  document.querySelector('.panel').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('btnActualizar').addEventListener('click', () => {
  const id   = document.getElementById('camisetaId').value;
  const idx  = disenos.findIndex(d => d.id === id);
  if (idx === -1) return;

  disenos[idx].nombre      = document.getElementById('nombreDiseno').value.trim();
  disenos[idx].descripcion = document.getElementById('descripcion').value.trim();
  disenos[idx].colores     = { ...coloresActuales };

  guardarDisenos();
  renderizarDisenos();
  actualizarEstadisticas();
  cancelarEdicion();
  toast('success', 'Diseño actualizado');
});

document.getElementById('btnCancelar').addEventListener('click', cancelarEdicion);

function cancelarEdicion() {
  modoEdicion = false;
  document.getElementById('camisetaId').value   = '';
  document.getElementById('nombreDiseno').value = '';
  document.getElementById('descripcion').value  = '';
  coloresActuales = { ...coloresBase };
  Object.keys(coloresBase).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('fill', coloresBase[id]);
  });
  mostrar('btnGuardar');
  ocultar('btnActualizar');
  ocultar('btnCancelar');
}

// ─── VOTAR ───────────────────────────────────────────────────────────────────
function votar(id, estrella) {
  const idx = disenos.findIndex(d => d.id === id);
  if (idx === -1) return;

  const diseno = disenos[idx];
  const votoExistente = diseno.votos.find(v => v.userId === usuarioActual.id);

  if (votoExistente) {
    if (votoExistente.valor === estrella) {
      // quitar voto
      diseno.votos = diseno.votos.filter(v => v.userId !== usuarioActual.id);
    } else {
      votoExistente.valor = estrella;
    }
  } else {
    diseno.votos.push({ userId: usuarioActual.id, valor: estrella });
  }

  guardarDisenos();
  renderizarDisenos();
  actualizarEstadisticas();
}

// ─── ELIMINAR ─────────────────────────────────────────────────────────────────
async function eliminarDiseno(id) {
  const confirm = await Swal.fire({
    title: '¿Eliminar diseño?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#991b1b'
  });
  if (!confirm.isConfirmed) return;

  disenos = disenos.filter(d => d.id !== id);
  guardarDisenos();
  renderizarDisenos();
  actualizarEstadisticas();
  toast('success', 'Diseño eliminado');
}

// ─── RENDERIZAR LISTA ─────────────────────────────────────────────────────────
function renderizarDisenos() {
  const contenedor = document.getElementById('contenedorCamisetas');

  if (disenos.length === 0) {
    contenedor.innerHTML = `
      <div class="mensaje-vacio">
        <p style="font-size:2rem">👕</p>
        <p>Aún no hay diseños. ¡Sé el primero en crear uno!</p>
      </div>`;
    return;
  }

  contenedor.innerHTML = disenos.map(diseno => {
    const esAutor  = diseno.autorId === usuarioActual?.id;
    const promedio = diseno.votos.length
      ? (diseno.votos.reduce((a, v) => a + v.valor, 0) / diseno.votos.length).toFixed(1)
      : '—';
    const miVoto = diseno.votos.find(v => v.userId === usuarioActual?.id)?.valor || 0;

    const estrellasHtml = [1,2,3,4,5].map(n => `
      <button class="estrella ${n <= miVoto ? 'activa' : ''}" onclick="votar('${diseno.id}', ${n})">★</button>
    `).join('');

    const coloresHtml = Object.values(diseno.colores).map(c => `
      <div class="color-box" style="background:${c}" title="${c}"></div>
    `).join('');

    return `
      <div class="tarjeta-camiseta">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem">
          <div>
            <h3>${diseno.nombre}</h3>
            <small style="color:var(--muted)">por ${diseno.autorNombre} · ${diseno.fecha}</small>
          </div>
          <span style="font-weight:700;font-size:1.1rem;white-space:nowrap">⭐ ${promedio}</span>
        </div>
        ${diseno.descripcion ? `<p class="descripcion-card">${diseno.descripcion}</p>` : ''}
        <div class="mini-camisa" style="margin:0.75rem 0">${coloresHtml}</div>
        <div class="acciones-card">
          <div class="estrellas-votacion">${estrellasHtml}</div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            ${esAutor ? `
              <button class="btn-edit" onclick="iniciarEdicion('${diseno.id}')">✏️ Editar</button>
              <button class="btn-delete" onclick="eliminarDiseno('${diseno.id}')">🗑️ Eliminar</button>
            ` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ─── ESTADÍSTICAS ─────────────────────────────────────────────────────────────
function actualizarEstadisticas() {
  const totalDisenos = disenos.length;
  const autores      = [...new Set(disenos.map(d => d.autorId))].length;
  const totalVotos   = disenos.reduce((a, d) => a + d.votos.length, 0);
  const promedio     = disenos.length
    ? (disenos.reduce((a, d) => {
        if (!d.votos.length) return a;
        return a + d.votos.reduce((s, v) => s + v.valor, 0) / d.votos.length;
      }, 0) / disenos.filter(d => d.votos.length).length || 0).toFixed(1)
    : '0';

  document.getElementById('statDisenos').textContent  = totalDisenos;
  document.getElementById('statUsuarios').textContent = autores;
  document.getElementById('statVotos').textContent    = totalVotos;
  document.getElementById('statPromedio').textContent = isNaN(promedio) ? '0' : promedio;
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
document.querySelectorAll('.badge').forEach(el => {
  el.style.cssText += ';display:inline-block;background:linear-gradient(90deg,#3F5D44,#6F8F7A);color:#fff;padding:.35rem .9rem;border-radius:999px;font-size:.8rem;font-weight:700;letter-spacing:.04em;margin-bottom:.75rem';
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
const sesionGuardada = cargarSesion();
if (sesionGuardada) {
  mostrarApp(sesionGuardada);
} else {
  mostrar('pantallaAuth');
}
