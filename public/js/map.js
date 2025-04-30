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
  
  // Fungsi untuk memformat tanggal
  function formatTimestamp(timestamp) {
    if (!timestamp) return 'Tidak diketahui';
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Inisialisasi peta
  const map = L.map('map').setView([-8.112, 115.088], 13);
  
  // Tambahkan tile layer OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  // Inisialisasi grup layer untuk marker
  const markersLayer = L.layerGroup().addTo(map);
  
  // Fungsi untuk mengambil data kursus dari Firebase
  function fetchCoursesData() {
    // Bersihkan marker yang ada
    markersLayer.clearLayers();
    
    // Referensi ke node courses di Firebase
    const coursesRef = database.ref('courses');
    
    // Ambil semua data kursus
    coursesRef.once('value')
      .then((snapshot) => {
        const coursesData = snapshot.val();
        
        if (!coursesData) {
          console.log('Tidak ada data kursus yang tersedia');
          return;
        }
        
        // Iterasi melalui setiap kursus
        Object.entries(coursesData).forEach(([courseId, course]) => {
          // Pastikan kursus memiliki koordinat
          if (course.coordinates) {
            const [lat, lng] = course.coordinates.split(',').map(Number);
            
            // Validasi koordinat
            if (!isNaN(lat) && !isNaN(lng)) {
              // Buat marker
              const marker = L.marker([lat, lng]).addTo(markersLayer);
              
              // Buat konten popup
          // Fungsi untuk memformat nomor WhatsApp
function formatWhatsAppNumber(whatsappNumber) {
    if (!whatsappNumber) return '';
    
    // Jika sudah diawali dengan +, biarkan seperti itu
    if (whatsappNumber.startsWith('+')) {
      return whatsappNumber;
    }
    
    // Jika diawali dengan 0, ganti dengan +62
    if (whatsappNumber.startsWith('0')) {
      return '+62' + whatsappNumber.substring(1);
    }
    
    // Jika tidak ada keduanya, anggap sudah dalam format benar
    return whatsappNumber;
  }
  
  // Modifikasi bagian pembuatan popupContent dalam fetchCoursesData()
  const popupContent = `
    <div>
      <h3 class="text-lg font-semibold mb-2">${course.fullName}</h3>
      ${course.jlptLevel ? `<p><strong>JLPT:</strong> ${course.jlptLevel}</p>` : ''}
      <p><strong>Pendidikan:</strong> ${course.education}</p>
      <p><strong>Course Name :</strong> ${course.namecourses}</p>
      <p><strong>Whatsapp :</strong> <a href="https://wa.me/${formatWhatsAppNumber(course.whatsapp)}?text=hallo+kak+saya+ingin+tanya+terkait+${course.namecourses}" target=_blank class="hover:text-blue-600">Chat Tutor</a> </p>
    </div>
  `;
              
              // Tambahkan popup ke marker
              marker.bindPopup(popupContent);
            }
          }
        });
      })
      .catch((error) => {
        console.error('Gagal mengambil data kursus:', error);
      });
  }
  function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const educationFilter = document.getElementById('educationFilter').value;
    
    // Referensi ke node courses di Firebase
    const coursesRef = database.ref('courses');
    
    // Ambil semua data kursus
    coursesRef.once('value')
      .then((snapshot) => {
        const coursesData = snapshot.val();
        markersLayer.clearLayers();
        
        if (!coursesData) {
          console.log('Tidak ada data kursus yang tersedia');
          return;
        }
        
        // Iterasi melalui setiap kursus
        Object.entries(coursesData).forEach(([courseId, course]) => {
          // Filter berdasarkan pencarian dan pendidikan
          const courseNameMatch = course.namecourses?.toLowerCase().includes(searchTerm) || !searchTerm;
          const educationMatch = course.education === educationFilter || !educationFilter;
          
          if (course.coordinates && courseNameMatch && educationMatch) {
            const [lat, lng] = course.coordinates.split(',').map(Number);
            
            if (!isNaN(lat) && !isNaN(lng)) {
              // Buat marker
              const marker = L.marker([lat, lng]).addTo(markersLayer);
              
              // Buat konten popup
              const popupContent = `
                <div>
                  <h3 class="text-lg font-semibold mb-2">${course.fullName}</h3>
                  ${course.jlptLevel ? `<p><strong>JLPT:</strong> ${course.jlptLevel}</p>` : ''}
                  <p><strong>Pendidikan:</strong> ${course.education}</p>
                  <p><strong>Course Name:</strong> ${course.namecourses}</p>
                  <p><strong>Whatsapp:</strong> <a href="https://wa.me/${course.whatsapp}?text=hallo+kak+saya+ingin+tanya+terkait+${course.namecourses}" target=_blank class="hover:text-blue-600">Chat Tutor</a></p>
                </div>
              `;
              
              marker.bindPopup(popupContent);
            }
          }
        });
      })
      .catch((error) => {
        console.error('Gagal mengambil data kursus:', error);
      });
  }
  
  // Tambahkan event listener untuk tombol search
  document.getElementById('searchButton').addEventListener('click', performSearch);
  
  // Tambahkan event listener untuk enter pada input search
  document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  // Panggil fungsi fetch data saat halaman dimuat
  document.addEventListener('DOMContentLoaded', () => {
    fetchCoursesData();
  });
  
  // Refresh data setiap 5 menit
  setInterval(fetchCoursesData, 300000);
  
  // Tambahkan listener untuk event auth state changed
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('User signed in:', user.displayName);
      // Refresh data ketika user login
      fetchCoursesData();
    } else {
      console.log('User signed out');
    }
  });