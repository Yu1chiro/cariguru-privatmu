const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const app = express();

// Middleware untuk session
// Middleware CORS
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));
  
  // Middleware untuk session
  app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set true di production dengan HTTPS
      httpOnly: true,
      sameSite:'strict',
      maxAge: 24 * 60 * 60 * 1000
    }
  }));
  


// Middleware untuk file statis
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Middleware untuk logging (opsional)

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });
// Middleware untuk memeriksa autentikasi
const checkAuth = (req, res, next) => {
    if (!req.session.user) {
        // Jika tidak ada session, return HTML page with Tailwind CSS
        return res.status(401).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Access Forbidden</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-gray-100 h-screen flex items-center justify-center">
            <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
              <div class="mb-6">
                <svg class="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <h1 class="text-2xl font-bold text-gray-800 mb-2">Access Forbidden</h1>
              <p class="text-gray-600 mb-6">Sorry, you don't have permission to access this resource.</p>
              <a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-md transition duration-200">Beranda</a>
            </div>
          </body>
          </html>
        `);
      }
    // Periksa data user minimal
    if (!req.session.user.uid || !req.session.user.email) {
      req.session.destroy();
      return res.status(401).json({ error: 'Invalid session data' });
    }
  
    // Periksa waktu session
    const sessionAge = Date.now() - req.session.user.timestamp;
    const maxSessionAge = 24 * 60 * 60 * 1000;
    
    if (sessionAge > maxSessionAge) {
      req.session.destroy();
      return res.status(401).json({ error: 'Session expired' });
    }
  
    // Jika semua valid, lanjutkan
    next();
  };
// Rute utama
app.get('/', (req, res) => {
  // Jika sudah login, redirect ke dashboard
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rute dashboard dengan middleware checkAuth
app.get('/dashboard', checkAuth, (req, res) => {
    // Set header tambahan untuk mencegah caching
    res.set({
      'Cache-Control': 'no-store',
    });
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  });

// Rute untuk menyimpan session setelah login berhasil
app.post('/auth/success', (req, res) => {
    // Tambahkan logging untuk debugging
    
    const userData = req.body;
    if (!userData.uid || !userData.email) {
      console.log('Data user tidak valid');
      return res.status(400).json({ error: 'Invalid user data' });
    }
    
    userData.serverTimestamp = Date.now();
    req.session.user = userData;
        res.json({ success: true, message: 'Session created' });
  });

// Rute untuk mendapatkan data user
app.get('/auth/user', checkAuth, (req, res) => {
  // Return data user tanpa sensitive information
  const { uid, email, name, photoURL, timestamp } = req.session.user;
  res.json({ uid, email, name, photoURL, timestamp });
});

// Rute logout
app.get('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // Hapus session cookie
    res.json({ success: true });
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).send('Halaman tidak ditemukan');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Terjadi kesalahan!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});