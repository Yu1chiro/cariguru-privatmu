        // Fungsi untuk memformat tanggal
        function formatTimestamp(timestamp) {
          if (!timestamp) return 'Tidak diketahui';
          const date = new Date(timestamp);
          return date.toLocaleString();
        }
      
        // Inisialisasi Firebase
        const firebaseConfig = {
          apiKey: "AIzaSyAVqYaFWRQq3h_YboSmlEaA1lpoT5UXJcI",
          authDomain: "location-courses.firebaseapp.com",
          databaseURL: "https://location-courses-default-rtdb.asia-southeast1.firebasedatabase.app",
          projectId: "location-courses",
          storageBucket: "location-courses.appspot.com",
          messagingSenderId: "219663581034",
          appId: "1:219663581034:web:110291ffa829c717c82f13"
        };
        
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const database = firebase.database();
    
        // Fungsi untuk memverifikasi session server
        async function verifyServerSession() {
          try {
            const response = await fetch('/auth/user', {
              credentials: 'include'
            });
            
            if (!response.ok) {
              throw new Error('Session tidak valid');
            }
            
            const userData = await response.json();
            
            if (!userData || !userData.uid) {
              throw new Error('Data user tidak valid');
            }
            
            return userData;
          } catch (error) {
            console.error('Gagal memverifikasi session:', error);
            throw error;
          }
        }
    
        // Fungsi untuk memuat data user dengan verifikasi ganda
        async function loadUserData() {
          try {
            // Verifikasi session server terlebih dahulu
            const userData = await verifyServerSession();
            
            // Verifikasi auth state di client
            const currentUser = auth.currentUser;
            if (!currentUser || currentUser.uid !== userData.uid) {
              throw new Error('Autentikasi tidak valid');
            }
    
            // Tampilkan data user
            document.getElementById('userInfo').innerHTML = `
              <div class="flex items-center space-x-4">
                <img src="${userData.photoURL || 'https://via.placeholder.com/150'}" 
                     class="w-16 h-16 rounded-full">
                <div>
                  <h3 class="text-lg font-medium">${userData.name || 'No name'}</h3>
                  <p class="text-gray-600">${userData.email}</p>
                </div>
              </div>
              <div>
                <p class="text-sm text-gray-500">
                  Bergabung pada: ${formatTimestamp(userData.timestamp)}
                </p>
              </div>
            `;
            
            // Simpan UID user untuk digunakan nanti
            window.currentUserUID = userData.uid;
            
            // Load data kursus setelah data user berhasil dimuat
            await loadCoursesData();
            
          } catch (error) {
            console.error('Gagal memuat data user:', error);
            // Logout dan redirect ke halaman utama
            auth.signOut();
            window.location.href = '/';
          }
        }
    
        // Fungsi untuk memuat data kursus dari folder courses/ dengan filter berdasarkan userUID
        async function loadCoursesData() {
          if (!window.currentUserUID) {
            console.error('User UID tidak tersedia');
            return;
          }
          
          try {
            const dbRef = database.ref('courses').orderByChild('userUID').equalTo(window.currentUserUID);
            
            dbRef.on('value', (snapshot) => {
              const coursesData = snapshot.val();
              const tableBody = document.getElementById('coursesTableBody');
              
              if (!coursesData || Object.keys(coursesData).length === 0) {
                tableBody.innerHTML = `
                  <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                      Belum ada data kursus. Klik "Tambah Kursus" untuk menambahkan.
                    </td>
                  </tr>
                `;
                return;
              }
              
              tableBody.innerHTML = '';
              Object.entries(coursesData).forEach(([courseId, course]) => {
                const [lat, lng] = course.coordinates.split(',').map(Number);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                  <td class="px-6 py-4 whitespace-nowrap">${course.fullName}</td>
                  <td class="px-6 py-4 whitespace-nowrap">${course.education}</td>
                  <td class="px-6 py-4 whitespace-nowrap">${course.jlptLevel || '-'}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <a href="https://wa.me/${course.whatsapp}" target="_blank" class="text-blue-500 hover:text-blue-700">
                      ${course.whatsapp}
                    </a>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap space-x-2">
                    <button onclick="editCourse('${courseId}')" class="text-yellow-500 hover:text-yellow-700">Edit</button>
                    <button onclick="deleteCourse('${courseId}')" class="text-red-500 hover:text-red-700">Hapus</button>
                    <a href="/" target=_blank class="text-blue-600 hover:text-blue-700">View Maps</a>
                  </td>
                `;
                tableBody.appendChild(row);
              });
            });
            
          } catch (error) {
            console.error('Gagal memuat data kursus:', error);
            throw error;
          }
        }
    
        // Fungsi global untuk edit course
        window.editCourse = async function(courseId) {
          try {
            if (!window.currentUserUID || !courseId) {
              throw new Error('Data tidak valid');
            }
            
            const dbRef = database.ref(`courses/${courseId}`);
            const snapshot = await dbRef.once('value');
            const courseData = snapshot.val();
            
            if (!courseData || courseData.userUID !== window.currentUserUID) {
              throw new Error('Data kursus tidak ditemukan atau tidak memiliki akses');
            }
            
            // Tampilkan form
            document.getElementById('courseFormContainer').classList.remove('hidden');
            
            // Isi form dengan data yang ada
            const form = document.getElementById('courseForm');
            form.dataset.editId = courseId;
            form.fullName.value = courseData.fullName;
            form.education.value = courseData.education;
            form.namecourses.value = courseData.namecourses;
            form.jlptLevel.value = courseData.jlptLevel || '';
            form.whatsapp.value = courseData.whatsapp;
            form.coordinates.value = courseData.coordinates;
            
            
            // Scroll ke form
            form.scrollIntoView({ behavior: 'smooth' });
            
          } catch (error) {
            console.error('Gagal mengedit kursus:', error);
            alert('Terjadi kesalahan saat memuat data kursus: ' + error.message);
          }
        };
    
        // Fungsi global untuk delete course
        window.deleteCourse = async function(courseId) {
          if (!confirm('Apakah Anda yakin ingin menghapus kursus ini?')) return;
          
          try {
            if (!window.currentUserUID || !courseId) {
              throw new Error('Data tidak valid');
            }
            
            // Verifikasi bahwa course dimiliki oleh user sebelum menghapus
            const dbRef = database.ref(`courses/${courseId}`);
            const snapshot = await dbRef.once('value');
            const courseData = snapshot.val();
            
            if (!courseData || courseData.userUID !== window.currentUserUID) {
              throw new Error('Anda tidak memiliki izin untuk menghapus kursus ini');
            }
            
            await dbRef.remove();
            alert('Kursus berhasil dihapus');
            
          } catch (error) {
            console.error('Gagal menghapus kursus:', error);
            alert('Terjadi kesalahan saat menghapus kursus: ' + error.message);
          }
        };
    
        // Fungsi untuk logout
        function handleLogout() {
          // Lakukan logout dari Firebase terlebih dahulu
          auth.signOut()
            .then(() => {
              // Setelah logout dari Firebase, lakukan logout dari server
              return fetch('/auth/logout', {
                method: 'GET',
                credentials: 'include' // Penting untuk mengirim cookie session
              });
            })
            .then(response => {
              if (!response.ok) {
                throw new Error('Logout dari server gagal');
              }
              return response.json();
            })
            .then(data => {
              // Redirect ke halaman utama dengan force reload untuk membersihkan cache
              window.location.href = '/';
              window.location.reload(true);
            })
            .catch(error => {
              console.error('Error during logout:', error);
              // Tetap redirect meskipun ada error
              window.location.href = '/';
            });
        }
    
        // Event Listeners
        document.addEventListener('DOMContentLoaded', async () => {
          // Tunggu hingga Firebase auth siap
          auth.onAuthStateChanged(async (user) => {
            if (user) {
              try {
                // User terautentikasi, muat data
                await loadUserData();
                setupEventListeners();
              } catch (error) {
                console.error('Gagal memuat dashboard:', error);
                window.location.href = '/';
              }
            } else {
              // Tidak ada user yang login, redirect ke home
              window.location.href = '/';
            }
          });
        });
    
        // Setup event listeners untuk form
        function setupEventListeners() {
          // Toggle form tambah kursus
          document.getElementById('addCourseBtn').addEventListener('click', () => {
            const formContainer = document.getElementById('courseFormContainer');
            formContainer.classList.toggle('hidden');
            
            // Reset form jika dalam mode tambah baru
            if (!formContainer.classList.contains('hidden')) {
              const form = document.getElementById('courseForm');
              form.reset();
              delete form.dataset.editId;
              formContainer.scrollIntoView({ behavior: 'smooth' });
            }
          });
          
          // Batal form
          document.getElementById('cancelFormBtn').addEventListener('click', () => {
            document.getElementById('courseFormContainer').classList.add('hidden');
          });
          document.getElementById('logoutButton').addEventListener('click', handleLogout);
          
          // Submit form
          document.getElementById('courseForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
              const form = e.target;
              const formData = {
                fullName: form.fullName.value.trim(),
                education: form.education.value.trim(),
                namecourses: form.namecourses.value.trim(), // Add this line
                jlptLevel: form.jlptLevel.value.trim(),
                whatsapp: form.whatsapp.value.trim(),
                coordinates: form.coordinates.value.trim(),
                userUID: window.currentUserUID,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
              };
              
              // Validasi data
              if (!formData.fullName || !formData.education || !formData.whatsapp || !formData.coordinates) {
                throw new Error('Semua field wajib diisi kecuali JLPT Level');
              }
              
              // Validasi koordinat
              const coords = formData.coordinates.split(',');
              if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
                throw new Error('Format koordinat tidak valid. Gunakan format: latitude,longitude');
              }
              
              const dbRef = database.ref('courses');
              
              // Jika edit, gunakan ID yang ada
              if (form.dataset.editId) {
                // Verifikasi bahwa course dimiliki oleh user sebelum mengedit
                const snapshot = await database.ref(`courses/${form.dataset.editId}`).once('value');
                const existingCourse = snapshot.val();
                
                if (!existingCourse || existingCourse.userUID !== window.currentUserUID) {
                  throw new Error('Anda tidak memiliki izin untuk mengedit kursus ini');
                }
                
                // Hanya update data yang diperlukan, jangan timpa userUID dan createdAt
                const updateData = {
                  fullName: formData.fullName,
                  education: formData.education,
                  jlptLevel: formData.jlptLevel,
                  whatsapp: formData.whatsapp,
                  coordinates: formData.coordinates,
                  updatedAt: formData.updatedAt
                };
                
                await dbRef.child(form.dataset.editId).update(updateData);
                alert('Kursus berhasil diperbarui');
              } else {
                // Jika baru, push data baru
                await dbRef.push(formData);
                alert('Kursus berhasil ditambahkan');
              }
              
              // Reset form
              form.reset();
              document.getElementById('courseFormContainer').classList.add('hidden');
              
            } catch (error) {
              console.error('Gagal menyimpan kursus:', error);
              alert('Error: ' + error.message);
            }
          });
        }
