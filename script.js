const apiUrl = 'https://threecloud-backend.onrender.com';
let currentAlbumId = null;
let selectedFile = null; 

// =========================================================
// ---- KHỞI CHẠY LẮNG NGHE PHÍM ENTER KHI ĐÃ TẢI DOM ----
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    // Enter cho Form Đăng nhập
    if(document.getElementById('username')) {
        document.getElementById('username').addEventListener('keypress', function(event) { if (event.key === 'Enter') login(); });
        document.getElementById('password').addEventListener('keypress', function(event) { if (event.key === 'Enter') login(); });
    }
    // Enter cho Form Đăng ký
    if(document.getElementById('reg-username')) {
        document.getElementById('reg-username').addEventListener('keypress', function(event) { if (event.key === 'Enter') register(); });
        document.getElementById('reg-password').addEventListener('keypress', function(event) { if (event.key === 'Enter') register(); });
    }
    // Enter khi tạo Album ở Thư viện ảnh cá nhân
    if (document.getElementById('new-album-name')) {
        document.getElementById('new-album-name').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') { event.preventDefault(); createAlbum(); }
        });
    }
    // Enter khi tạo Album nhanh tại màn hình Upload ảnh
    if (document.getElementById('upload-new-album-name')) {
        document.getElementById('upload-new-album-name').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') { event.preventDefault(); createAlbumFromUpload(); }
        });
    }
    // Enter tại ô nhập Mật khẩu cũ / Mật khẩu mới trên Trang cá nhân
    if (document.getElementById('password-current')) {
        document.getElementById('password-current').addEventListener('keypress', function(event) { if (event.key === 'Enter') changePassword(); });
    }
    if (document.getElementById('password-new')) {
        document.getElementById('password-new').addEventListener('keypress', function(event) { if (event.key === 'Enter') changePassword(); });
    }
    // Enter tại các thanh tìm kiếm Thể loại
    if (document.getElementById('search-gallery-category')) {
        document.getElementById('search-gallery-category').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') { event.target.blur(); filterMyGalleryByCategory(); }
        });
    }
    if (document.getElementById('search-explore-category')) {
        document.getElementById('search-explore-category').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') { event.target.blur(); filterExploreByCategory(); }
        });
    }
});

// =========================================================
// ---- 1. XỬ LÝ MODAL (ĐĂNG NHẬP / ĐĂNG KÝ / ĐIỀU HƯỚNG) ----
// =========================================================
function showLogin() { 
    const modal = document.getElementById('login-modal');
    if(modal) modal.style.display = 'block'; 
}
function showRegister() { 
    const modal = document.getElementById('register-modal');
    if(modal) modal.style.display = 'block'; 
}

function switchLoginToRegister() {
    closeModals();
    showRegister();
}

function switchRegisterToLogin() {
    closeModals();
    showLogin();
}

function closeModals() { 
    document.querySelectorAll('.modal-auth').forEach(m => m.style.display = 'none'); 
    if(document.getElementById('username')) {
        document.getElementById('username').value = "";
        document.getElementById('password').value = "";
    }
    if(document.getElementById('reg-username')) {
        document.getElementById('reg-username').value = "";
        document.getElementById('reg-password').value = "";
        if(document.getElementById('reg-fullname')) document.getElementById('reg-fullname').value = "";
        if(document.getElementById('reg-email')) document.getElementById('reg-email').value = "";
        if(document.getElementById('reg-phone')) document.getElementById('reg-phone').value = "";
        if(document.getElementById('reg-gender')) document.getElementById('reg-gender').value = "Nam";
    }
    document.querySelectorAll('.password-wrapper input').forEach(input => input.type = 'password');
    document.querySelectorAll('.toggle-password-btn').forEach(btn => { btn.innerText = 'Hiện mật khẩu'; btn.style.color = '#64748b'; });
}

async function register() {
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value;
    const fullname = document.getElementById('reg-fullname') ? document.getElementById('reg-fullname').value.trim() : null;
    const email = document.getElementById('reg-email') ? document.getElementById('reg-email').value.trim() : null;
    const phone = document.getElementById('reg-phone') ? document.getElementById('reg-phone').value.trim() : null;
    const gender = document.getElementById('reg-gender') ? document.getElementById('reg-gender').value : "Nam";
    
    if (!user) return alert("Vui lòng điền Tên đăng nhập!");
    if (!pass) return alert("Vui lòng điền Mật khẩu!");
    if (pass.length < 5) return alert("Mật khẩu tối thiểu 5 ký tự!");
    if (!/[A-Z]/.test(pass)) return alert("Mật khẩu phải có ít nhất 1 chữ IN HOA!");
    if (!/[!@#$%^&*(),.?":{}|<>_]/.test(pass)) return alert("Mật khẩu phải có ít nhất 1 ký tự đặc biệt!");
    
    const payload = { username: user, password: pass, fullname: fullname, email: email, phone: phone, gender: gender };
    
    try {
        const res = await fetch(`${apiUrl}/register/`, { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) 
        });
        if (res.ok) { 
            alert("Đăng ký thành công!"); closeModals(); showLogin(); 
        } else { 
            const data = await res.json(); alert(data.detail); 
        }
    } catch (error) { alert("Lỗi kết nối Backend."); }
}

async function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    if (!user || !pass) return alert("Vui lòng nhập đủ thông tin!");
    
    const res = await fetch(`${apiUrl}/login/`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user, password: pass }) 
    });
    const data = await res.json();
    if (res.ok) {
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('username', data.username);
        closeModals(); checkLoginStatus();
    } else { alert(data.detail); }
}

function logout() {
    localStorage.clear();
    currentAlbumId = null;
    removeSelectedFile(); 
    const dropdown = document.getElementById('dropdown-menu');
    if(dropdown) dropdown.classList.remove('show');
    checkLoginStatus();
}

function checkLoginStatus() {
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    const btnLogin = document.getElementById('nav-btn-login');
    const btnReg = document.getElementById('nav-btn-register');
    const userMenu = document.getElementById('user-menu');
    const avatarInitial = document.getElementById('nav-avatar-initial');
    
    if (userId) {
        if(btnLogin) btnLogin.style.display = 'none';
        if(btnReg) btnReg.style.display = 'none';
        if(userMenu) userMenu.style.display = 'inline-block';
        if(avatarInitial) avatarInitial.innerText = username.charAt(0).toUpperCase();
        showExplore(); 
    } else {
        if(btnLogin) btnLogin.style.display = 'inline-block';
        if(btnReg) btnReg.style.display = 'inline-block';
        if(userMenu) userMenu.style.display = 'none';
        showExplore(); 
    }
}

function toggleDropdown() { 
    const dropdown = document.getElementById('dropdown-menu');
    if(dropdown) dropdown.classList.toggle('show'); 
}

window.onclick = function(event) {
    if (!event.target.matches('.nav-avatar') && !event.target.matches('#nav-avatar-initial')) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].classList.contains('show')) dropdowns[i].classList.remove('show');
        }
    }
}

// =========================================================
// ---- 2. QUẢN LÝ CHUYỂN ĐỔI GIAO DIỆN (TABS) ----
// =========================================================
function hideAllTabs() {
    const sections = ['profile-section', 'upload-section', 'gallery-section', 'explore-section'];
    sections.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; });
}

function clearSearchInputs() {
    if(document.getElementById('search-gallery-category')) document.getElementById('search-gallery-category').value = "";
    if(document.getElementById('search-explore-category')) document.getElementById('search-explore-category').value = "";
}

function showProfile() { 
    hideAllTabs(); clearSearchInputs();
    const el = document.getElementById('profile-section'); 
    if(el) el.style.display = 'block'; 
    loadUserProfile(); 
}

function showGallery() { 
    hideAllTabs(); clearSearchInputs();
    const el = document.getElementById('gallery-section'); 
    if(el) el.style.display = 'block'; 
    currentAlbumId = null; 
    loadAlbums(); 
    loadGallery(); 
}

// Hàm chuyển tab tải lên yêu cầu đăng nhập trước
function showUpload() { 
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        alert("Vui lòng đăng nhập tài khoản để sử dụng tính năng tải ảnh lên! 🔒");
        showLogin();
        return;
    }
    hideAllTabs(); clearSearchInputs();
    const el = document.getElementById('upload-section'); 
    if(el) el.style.display = 'block'; 
    loadAlbums(); 
    removeSelectedFile(); 
}

function showExplore() { 
    hideAllTabs(); clearSearchInputs();
    const el = document.getElementById('explore-section'); 
    if(el) el.style.display = 'block'; 
    loadExploreGallery(); 
}

// =========================================================
// ---- 3. XỬ LÝ ALBUM BONG BÓNG KÈM NÚT XÓA ✕ VÀ LỌC ----
// =========================================================
async function loadAlbums() {
    const userId = localStorage.getItem('user_id');
    if(!userId) return; 
    try {
        const res = await fetch(`${apiUrl}/albums/${userId}`);
        if (res.ok) {
            const data = await res.json();
            const albumList = document.getElementById('album-list');
            const albumSelect = document.getElementById('album-select');
            
            if(albumList) albumList.innerHTML = `<button onclick="filterByAlbum(null)" style="padding: 6px 14px; border-radius: 20px; background: ${currentAlbumId === null ? '#2196F3' : '#e0e0e0'}; color: ${currentAlbumId === null ? 'white' : '#333'}; border: none; cursor: pointer; font-weight: bold; margin: 5px;">Tất Cả Ảnh</button>`;
            if(albumSelect) albumSelect.innerHTML = `<option value="">-- Tải lên tự do --</option>`;

            if (data.albums) {
                data.albums.forEach(album => {
                    const wrapper = document.createElement('div');
                    wrapper.style = "display: inline-flex; align-items: center; background: #e0e0e0; border-radius: 20px; margin: 5px; overflow: hidden; padding-right: 10px; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05);";
                    if (currentAlbumId == album.id) wrapper.style.background = "#2196F3";

                    const btn = document.createElement('button');
                    btn.innerText = `📁 ${album.name}`;
                    btn.style = `padding: 6px 6px 6px 12px; background: transparent; color: ${currentAlbumId == album.id ? 'white' : '#333'}; border: none; cursor: pointer; font-weight: bold; font-size: 13px;`;
                    btn.onclick = () => filterByAlbum(album.id);
                    wrapper.appendChild(btn);

                    const deleteBtn = document.createElement('span');
                    deleteBtn.innerText = "✕";
                    deleteBtn.style = `cursor: pointer; font-weight: bold; font-size: 11px; margin-left: 5px; color: ${currentAlbumId == album.id ? '#fff' : '#e53935'}; padding: 2px 6px; border-radius: 50%; background: ${currentAlbumId == album.id ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)'}; transition: 0.2s; display: flex; align-items: center; justify-content: center;`;
                    deleteBtn.onclick = (e) => { e.stopPropagation(); deleteAlbum(album.id, album.name); };
                    wrapper.appendChild(deleteBtn);

                    if(albumList) albumList.appendChild(wrapper);

                    const opt = document.createElement('option');
                    opt.value = album.id; opt.innerText = album.name;
                    if(albumSelect) albumSelect.appendChild(opt);
                });
            }
        }
    } catch (err) { console.error("Lỗi nạp danh sách Album:", err); }
}

async function createAlbum() {
    const nameInput = document.getElementById('new-album-name');
    if (!nameInput) return;
    const name = nameInput.value.trim();
    const userId = localStorage.getItem('user_id');
    if (!name) return alert("Vui lòng nhập tên album!");
    
    const res = await fetch(`${apiUrl}/albums/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ album_name: name, user_id: userId }) });
    if (res.ok) { nameInput.value = ""; loadAlbums(); loadUserProfile(); }
}

async function createAlbumFromUpload() {
    const nameInput = document.getElementById('upload-new-album-name');
    if (!nameInput) return;
    const name = nameInput.value.trim();
    const userId = localStorage.getItem('user_id');
    if (!name) return alert("Vui lòng nhập tên album!");

    try {
        const res = await fetch(`${apiUrl}/albums/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ album_name: name, user_id: parseInt(userId) }) });
        if (res.ok) { alert(`🎉 Tạo Album "${name}" thành công tốt đẹp!`); nameInput.value = ""; await loadAlbums(); }
    } catch (error) { alert("Lỗi đường truyền Backend!"); }
}

async function deleteAlbum(albumId, albumName) {
    if (!confirm(`Bạn chắc chắn muốn xóa vĩnh viễn album "${albumName}" chứ?\n(Ảnh bên trong album sẽ tự động đưa về trạng thái tự do, không bị xóa mất ảnh)`)) return;
    try {
        const res = await fetch(`${apiUrl}/albums/${albumId}`, { method: 'DELETE' });
        if (res.ok) { currentAlbumId = null; await loadAlbums(); await loadGallery(); }
    } catch (error) { alert("Lỗi mạng, không thể xóa album!"); }
}

function filterByAlbum(albumId) { currentAlbumId = albumId; loadGallery(); }

// =========================================================
// ---- 4. XỬ LÝ CHỌN FILE VÀ UPLOAD THEO LOGIC RẼ NHÁNH ----
// =========================================================
const dropArea = document.getElementById('drop-area');
if(dropArea) {
    const fileInput = document.getElementById('fileElem');
    const uploadBtn = document.getElementById('upload-btn');
    if(uploadBtn) uploadBtn.addEventListener('click', () => fileInput.click());
    if(fileInput) fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false));
    dropArea.addEventListener('drop', (e) => handleFileSelect(e.dataTransfer.files[0]));
}

function handleFileSelect(file) {
    if (!file) return;
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) return alert("Hệ thống chỉ chấp nhận định dạng JPG hoặc PNG!");
    selectedFile = file;

    const reader = new FileReader();
    reader.onload = function(e) {
        const previewImg = document.getElementById('upload-preview');
        const previewContainer = document.getElementById('preview-container');
        const submitBtn = document.getElementById('submit-upload-btn');
        const dropText = document.getElementById('drop-text');

        if(previewImg) previewImg.src = e.target.result;
        if(previewContainer) previewContainer.style.display = 'block';
        if(submitBtn) submitBtn.style.display = 'block'; 
        if(dropText) dropText.innerText = "Đã nhận ảnh! Bạn có thể chọn thể loại và bấm lưu.";
    }
    reader.readAsDataURL(file);
}

function removeSelectedFile() {
    selectedFile = null;
    const previewImg = document.getElementById('upload-preview');
    const previewContainer = document.getElementById('preview-container');
    const submitBtn = document.getElementById('submit-upload-btn');
    const dropText = document.getElementById('drop-text');
    const fileInput = document.getElementById('fileElem');

    if(previewImg) previewImg.src = "";
    if(previewContainer) previewContainer.style.display = 'none';
    if(submitBtn) submitBtn.style.display = 'none'; 
    if(dropText) dropText.innerText = "Kéo thả ảnh vào đây hoặc click chọn file";
    if(fileInput) fileInput.value = ""; 
}

async function confirmAndUpload() {
    if (!selectedFile) return alert("Vui lòng chọn hình ảnh trước!");
    const userId = localStorage.getItem('user_id');
    const albumId = document.getElementById('album-select').value;
    const isPublicCheckbox = document.getElementById('is-public');
    const isPublic = (isPublicCheckbox && isPublicCheckbox.checked) ? 1 : 0;

    const selectCat = document.getElementById('upload-category') ? document.getElementById('upload-category').value : "Chưa xác định";
    const customCatInput = document.getElementById('upload-custom-category');
    const customCat = customCatInput ? customCatInput.value.trim() : "";
    
    let category = "Chưa xác định";
    if (customCat !== "") {
        category = customCat;
    } else {
        category = selectCat;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('user_id', userId);
    formData.append('is_public', isPublic); 
    formData.append('category', category); 
    if (albumId) formData.append('album_id', albumId);

    const progBar = document.getElementById('progress-bar');
    const progContainer = document.querySelector('.progress-container');
    if(progContainer) progContainer.style.display = 'block';
    if(progBar) { progBar.style.width = '50%'; progBar.innerText = '50%'; }

    try {
        const res = await fetch(`${apiUrl}/upload/`, { method: 'POST', body: formData });
        if (res.ok) {
            if(progBar) { progBar.style.width = '100%'; progBar.innerText = '100%'; }
            alert("Đăng tải hình ảnh kèm Thể loại thành công! 🚀");
            removeSelectedFile();
            if(document.getElementById('upload-custom-category')) document.getElementById('upload-custom-category').value = "";
            if(document.getElementById('upload-category')) document.getElementById('upload-category').value = "Chưa xác định";
            showGallery(); 
            loadUserProfile(); 
        } else { alert("Lỗi tải lên S3!"); }
    } catch(err) { alert("Lỗi kết nối mạng!"); }
    finally { if(progContainer) progContainer.style.display = 'none'; }
}

function formatDate(isoString) {
    if(!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// =========================================================
// ---- 5. HIỂN THỊ KHO ẢNH CỦA TÔI ----
// =========================================================
async function loadGallery() {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    let url = `${apiUrl}/gallery/${userId}`;
    if (currentAlbumId) url += `?album_id=${currentAlbumId}`;
    
    try {
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            const gallery = document.getElementById('gallery');
            if(gallery) {
                gallery.innerHTML = ""; 
                if (data.images && data.images.length > 0) {
                    data.images.forEach(img => addImageToGallery(img.url, img.id, img.category, img.uploaded_at));
                } else {
                    gallery.innerHTML = "<p style='text-align: center; color: #888; grid-column: 1/-1; padding: 40px;'>Thư viện ảnh cá nhân của bạn đang trống!</p>";
                }
            }
        }
    } catch (e) { console.error(e); }
}

function addImageToGallery(url, id, category, uploadedAt) {
    const gallery = document.getElementById('gallery');
    if(!gallery) return;
    const div = document.createElement('div');
    div.className = 'img-card';
    div.setAttribute('data-category', category || 'Chưa phân loại');
    const filename = url.substring(url.lastIndexOf('/') + 1);
    
    div.innerHTML = `
        <img src="${url}" onclick="openZoom('${url}')" loading="lazy">
        <p style="margin: 6px 0; text-align: left;"><span style="background: #e3f2fd; color: #1565c0; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">🏷️ ${category || 'Chưa phân loại'}</span></p>
        <p style="font-size: 11px; color: #999; text-align: left; margin-bottom: 8px;">📅 Ngày: ${formatDate(uploadedAt)}</p>
        <div class="action-btns">
            <button class="download-btn" onclick="downloadImage('${url}', '${filename}')">⬇️ Tải</button>
            <button class="delete-btn" onclick="deleteImage(${id})">🗑️ Xóa</button>
        </div>
    `;
    gallery.appendChild(div);
}

// ✨ CHỨC NĂNG XEM ẢNH LỚN (ZOOM) - BẢO MỆT CHẶN KHÁCH VÃNG LAI TỰ ĐỘNG
function openZoom(url) {
    const userId = localStorage.getItem('user_id');
    
    // Nếu chưa đăng nhập (Khách vãng lai) -> Hiện thông báo bắt buộc, mở Form Đăng nhập và chặn xử lý tiếp
    if (!userId) {
        alert("Tính năng xem ảnh kích thước lớn chỉ dành cho thành viên. Vui lòng đăng nhập tài khoản! 🔒");
        showLogin();
        return;
    }

    // Nếu là thành viên đã đăng nhập thành công
    const modal = document.getElementById('image-modal');
    const zoomed = document.getElementById('img-zoomed');
    if(zoomed) zoomed.src = url;
    if(modal) modal.style.display = "block";
}

async function deleteImage(id) {
    if (!confirm("Bạn chắc chắn muốn xóa ảnh này chứ?")) return;
    const res = await fetch(`${apiUrl}/delete/${id}`, { method: 'DELETE' });
    if (res.ok) { loadGallery(); loadUserProfile(); }
}

// ✨ CHỨC NĂNG TẢI ẢNH (DOWNLOAD) - TỰ ĐỘNG LƯU VỀ MÁY 100% & BẢO MỆT CHẶN KHÁCH VÃNG LAI
async function downloadImage(url, filename) {
    const userId = localStorage.getItem('user_id');
    
    // Nếu chưa đăng nhập (Khách vãng lai) -> Chặn hành động tải ảnh, mở popup Đăng nhập
    if (!userId) {
        alert("Tính năng tải ảnh xuống máy chỉ dành cho thành viên. Vui lòng đăng nhập! 🔒");
        showLogin();
        return;
    }

    try {
        // Thực hiện Fetch bóc tách dữ liệu Blob để ép trình duyệt download file, không bị nhảy tab mới
        const response = await fetch(url, { method: 'GET', mode: 'cors' });
        if (!response.ok) throw new Error("Lỗi kết nối hoặc AWS S3 chặn CORS cấu hình");
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const tempLink = document.createElement('a');
        tempLink.href = blobUrl;
        
        // Đặt tên file ảnh tải về tự động, nếu không có tên thì tự đặt tên kèm chuỗi thời gian ngẫu nhiên
        tempLink.download = filename || `ThreeCloud_Photo_${Date.now()}.jpg`;
        
        document.body.appendChild(tempLink);
        tempLink.click();
        
        // Giải phóng bộ nhớ đệm và dọn rác thẻ DOM ẩn sau khi tải xong
        document.body.removeChild(tempLink);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.warn("Đang kích hoạt phương án tải dự phòng do rào cản CORS: ", error);
        // Giải pháp rẽ nhánh dự phòng tối ưu: Tạo thẻ định tuyến ảo để ép lưu file trực tiếp
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = filename || 'threecloud-photo.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// =========================================================
// ---- 6. HIỂN THỊ KHÁM PHÁ CỘNG ĐỒNG ----
// =========================================================
async function loadExploreGallery() {
    try {
        const res = await fetch(`${apiUrl}/gallery/public`);
        const exploreGallery = document.getElementById('explore-gallery');
        if(!exploreGallery) return;
        
        if (res.ok) {
            const data = await res.json();
            exploreGallery.innerHTML = ""; 
            
            if(data.images && data.images.length > 0) {
                data.images.forEach(img => {
                    const uploaderName = img.uploader_name || "Khách";
                    const firstLetter = uploaderName.charAt(0).toUpperCase();
                    const div = document.createElement('div');
                    div.className = 'explore-img-card'; 
                    div.innerHTML = `
                        <img src="${img.url}" onclick="openZoom('${img.url}')" loading="lazy">
                        <div class="explore-overlay">
                            <div class="explore-user-block" style="flex-direction: column; align-items: flex-start; gap: 2px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="explore-avatar-mini">${firstLetter}</div>
                                    <span class="explore-username">${uploaderName}</span>
                                </div>
                                <p style="margin-top: 5px;"><span style="background: rgba(255,255,255,0.25); color: #fff; padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: bold;">🏷️ ${img.category || 'Chưa phân loại'}</span></p>
                                <span style="color: #ccc; font-size: 10px;">📅 ${formatDate(img.uploaded_at)}</span>
                            </div>
                            <button class="explore-download-btn" onclick="downloadImage('${img.url}', '${img.name}')">⬇️ Tải xuống</button>
                        </div>
                    `;
                    exploreGallery.appendChild(div);
                });
            } else {
                exploreGallery.innerHTML = "<p style='text-align: center; color: #888; grid-column: 1/-1; padding: 40px;'>Cộng đồng trống trải quá!</p>";
            }
        }
    } catch (error) { console.error("Lỗi trang khám phá:", error); }
}

// =========================================================
// ---- 7. HỆ THỐNG TÌM KIẾM THỂ LOẠI KHÔNG PHÂN BIỆT CHỮ ----
// =========================================================
async function filterMyGalleryByCategory() {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    const keyword = document.getElementById('search-gallery-category').value.trim().toLowerCase();
    const imageCards = document.querySelectorAll('#gallery .img-card');
    let hasVisibleImage = false;

    imageCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category').toLowerCase();
        if (keyword === "" || keyword === "tất cả" || cardCategory.includes(keyword)) {
            card.style.display = 'block';
            hasVisibleImage = true;
        } else {
            card.style.display = 'none';  
        }
    });

    const noActionMsg = document.getElementById('gallery-empty-msg');
    if (!hasVisibleImage) {
        if (!noActionMsg) {
            const msg = document.createElement('p');
            msg.id = 'gallery-empty-msg';
            msg.style = "text-align: center; color: #888; grid-column: 1/-1; padding: 30px;";
            msg.innerText = `Không tìm thấy ảnh thuộc danh mục phù hợp với "${document.getElementById('search-gallery-category').value}" 🔍`;
            document.getElementById('gallery').appendChild(msg);
        }
    } else {
        if (noActionMsg) noActionMsg.remove();
    }
}

async function filterExploreByCategory() {
    const keyword = document.getElementById('search-explore-category').value.trim().toLowerCase();
    const exploreCards = document.querySelectorAll('#explore-gallery .explore-img-card');
    
    exploreCards.forEach(card => {
        const badge = card.querySelector('.explore-overlay p span');
        if (!badge) return;
        const badgeText = badge.innerText.replace('🏷️ ', '').trim().toLowerCase();
        if (keyword === "" || keyword === "tất cả" || badgeText.includes(keyword)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function quickSearchGallery(categoryName) {
    const searchInput = document.getElementById('search-gallery-category');
    if (searchInput) { searchInput.value = categoryName === 'Tất cả' ? '' : categoryName; filterMyGalleryByCategory(); }
}

// Hàm tìm kiếm nhanh ở trang khám phá có bảo mật chặn khách vãng lai
function quickSearchExplore(categoryName) {
    const searchInput = document.getElementById('search-explore-category');
    if (searchInput) { searchInput.value = categoryName === 'Tất cả' ? '' : categoryName; filterExploreByCategory(); }
}

// =========================================================
// ---- 8. TẢI DỮ LIỆU PROFILE ----
// =========================================================
async function loadUserProfile() {
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    if (!userId) return;

    const pName = document.getElementById('profile-name');
    const pInitial = document.getElementById('profile-initial');
    if(pName) pName.innerText = username;
    if(pInitial) pInitial.innerText = username.charAt(0).toUpperCase();
    toggleEditProfile(false);

    try {
        const response = await fetch(`${apiUrl}/user/${userId}/profile`);
        if (response.ok) {
            const data = await response.json();
            if(document.getElementById('stat-images')) document.getElementById('stat-images').innerText = data.total_images ?? 0;
            if(document.getElementById('stat-albums')) document.getElementById('stat-albums').innerText = data.total_albums ?? 0;
            if(document.getElementById('view-fullname')) document.getElementById('view-fullname').innerText = data.fullname || "Chưa cập nhật";
            if(document.getElementById('view-email')) document.getElementById('view-email').innerText = data.email || "Chưa cập nhật";
            if(document.getElementById('view-phone')) document.getElementById('view-phone').innerText = data.phone || "Chưa cập nhật";
            if(document.getElementById('view-gender')) document.getElementById('view-gender').innerText = data.gender || "Nam";

            if(document.getElementById('edit-fullname')) document.getElementById('edit-fullname').value = data.fullname || "";
            if(document.getElementById('edit-email')) document.getElementById('edit-email').value = data.email || "";
            if(document.getElementById('edit-phone')) document.getElementById('edit-phone').value = data.phone || "";
            if(document.getElementById('edit-gender')) document.getElementById('edit-gender').value = data.gender || "Nam";
        }
    } catch (error) { console.error("Lỗi tải profile:", error); }
}

function toggleEditProfile(isEditMode) {
    const viewBlock = document.getElementById('profile-view-mode');
    const editBlock = document.getElementById('profile-edit-mode');
    if (isEditMode) {
        if(viewBlock) viewBlock.style.display = 'none';
        if(editBlock) editBlock.style.display = 'block';
    } else {
        if(viewBlock) viewBlock.style.display = 'block';
        if(editBlock) editBlock.style.display = 'none';
        if(document.getElementById('password-current')) document.getElementById('password-current').value = "";
        if(document.getElementById('password-new')) document.getElementById('password-new').value = "";
    }
}

async function updateProfile() {
    const userId = localStorage.getItem('user_id');
    const payload = { 
        fullname: document.getElementById('edit-fullname').value.trim(), 
        email: document.getElementById('edit-email').value.trim(), 
        phone: document.getElementById('edit-phone').value.trim(), 
        gender: document.getElementById('edit-gender').value 
    };

    try {
        const res = await fetch(`${apiUrl}/user/${userId}/update-profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { alert("Cập nhật thông tin thành công! 🎉"); await loadUserProfile(); }
    } catch (error) { alert("Lỗi kết nối Server."); }
}

async function changePassword() {
    const userId = localStorage.getItem('user_id');
    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password-new').value;

    if (!currentPassword || !newPassword) return alert("Vui lòng điền đầy đủ!");
    if (newPassword.length < 5) return alert("Mật khẩu mới phải tối thiểu 5 ký tự!");
    if (!/[A-Z]/.test(newPassword)) return alert("Mật khẩu mới phải chứa chữ IN HOA!");
    if (!/[!@#$%^&*(),.?":{}|<>_]/.test(newPassword)) return alert("Mật khẩu mới phải chứa ký tự đặc biệt!");

    try {
        const res = await fetch(`${apiUrl}/user/${userId}/change-password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
        if (res.ok) {
            alert("Đổi mật khẩu thành công! 🎉");
            document.getElementById('password-current').value = ""; document.getElementById('password-new').value = "";
            toggleEditProfile(false);
        } else { const errData = await res.json(); alert("Lỗi: " + errData.detail); }
    } catch (error) { alert("Lỗi kết nối Server."); }
}

// =========================================================
// ---- 9. TƯƠNG TÁC HIỆN VÀ ẨN MẬT KHẨU CHO CÁC MÀN HÌNH ----
// =========================================================
function togglePasswordVisibility(inputId, toggleEl) {
    const passwordInput = document.getElementById(inputId);
    if (!passwordInput) return;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleEl.innerText = 'Ẩn mật khẩu';
        toggleEl.style.color = '#2196F3';
    } else {
        passwordInput.type = 'password';
        toggleEl.innerText = 'Hiện mật khẩu';
        toggleEl.style.color = '#64748b';
    }
}

// =========================================================
// ---- 10. KHỞI CHẠY TIẾN TRÌNH KHI LOAD TRANG ----
// =========================================================
checkLoginStatus();
loadExploreGallery(); 
loadAlbums();