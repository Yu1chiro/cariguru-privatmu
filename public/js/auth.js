// Firebase configuration

  // DOM elements
  const loginButton = document.getElementById('loginButton');
  const authModal = document.getElementById('authModal');
  const googleLogin = document.getElementById('googleLogin');
  const closeModal = document.getElementById('closeModal');
  
  // Show modal when login button is clicked
  loginButton.addEventListener('click', () => {
    authModal.style.display = 'flex';
  });
  
  // Close modal
  closeModal.addEventListener('click', () => {
    authModal.style.display = 'none';
  });
  
  // Google login
// Google login
googleLogin.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
      .then((result) => {
        const user = result.user;
        console.log('User berhasil login:', user.email);
        
        const userData = {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          timestamp: Date.now() // Gunakan client timestamp sementara
        };
        
        database.ref('userlogin/' + user.uid).set(userData)
          .then(() => {
            console.log('Data disimpan di Firebase');
            
            return fetch('/auth/success', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // PENTING untuk session
              body: JSON.stringify(userData)
            });
          })
          .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(data => {
            console.log('Response data:', data);
            if (data.success) {
              console.log('Redirecting to dashboard...');
              // Gunakan salah satu metode redirect berikut:
              window.location.href = '/dashboard'; // Pastikan tidak ada typo
              // atau:
              // window.location.assign('/dashboard');
            }
          })
          .catch((error) => {
            console.error('Error dalam proses login:', error);
            alert('Error: ' + error.message);
          });
      })
      .catch((error) => {
        console.error('Error login dengan Google:', error);
        alert('Login gagal: ' + error.message);
      });
  });
  
  // Check auth state
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('User is logged in:', user);
    } else {
      console.log('User is logged out');
    }
    function logout() {
        // Sign out dari Firebase
        auth.signOut()
          .then(() => {
            // Hapus session di server
            return fetch('/auth/logout', {
              method: 'GET',
              credentials: 'same-origin' // Penting untuk mengirim cookie
            });
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              window.location.href = '/';
            }
          })
          .catch(error => {
            console.error('Logout error:', error);
            window.location.href = '/'; // Tetap redirect meski ada error
          });
      }
      
      // Pasang event listener untuk logout button di dashboard
      if (document.getElementById('logoutButton')) {
        document.getElementById('logoutButton').addEventListener('click', logout);
      }
  });