import { db } from './firebase.js';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, query, orderBy } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const adminContent = document.getElementById('admin-content');
    const adminPass = document.getElementById('adminPass');
    const btnAuth = document.getElementById('btnAuth');
    const authError = document.getElementById('authError');

    // Admin Auth
    if (sessionStorage.getItem('tbt_auth') === 'true') {
        loginSection.style.display = 'none';
        adminContent.style.display = 'block';
        initAdminData();
    }

    btnAuth.addEventListener('click', () => {
        if (adminPass.value === 'TBT@2026') {
            sessionStorage.setItem('tbt_auth', 'true');
            loginSection.style.display = 'none';
            adminContent.style.display = 'block';
            authError.style.display = 'none';
            initAdminData();
        } else {
            authError.style.display = 'block';
            adminPass.value = '';
        }
    });

    adminPass.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnAuth.click();
    });

    // ----- TABS LOGIC -----
    const tabs = document.querySelectorAll('.admin-tab');
    const panes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.style.display = 'none');
            
            tab.classList.add('active');
            const targetId = tab.dataset.target;
            document.getElementById(targetId).style.display = 'block';
        });
    });

    function initAdminData() {
        loadPrizes();
        loadAwardConfig();
        loadCheckinList();
        loadAwardList();
    }

    // ----- ADMIN LOGIC (CONFIG PRIZES) -----
    
    let prizes = [];
    const prizeForm = document.getElementById('prizeForm');
    const prizeList = document.getElementById('prizeList');
    const btnSaveConfig = document.getElementById('btnSaveConfig');
    const saveStatus = document.getElementById('saveStatus');
    const btnCancel = document.getElementById('btnCancel');
    const btnReloadConfig = document.getElementById('btnReloadConfig');

    if (btnReloadConfig) btnReloadConfig.addEventListener('click', loadPrizes);

    
    async function loadPrizes() {
        try {
            const snap = await getDoc(doc(db, "config", "checkin_prizes"));
            if (snap.exists()) {
                const data = snap.data();
                prizes = data.items || [];
                // Backward compatibility if items are just strings
                prizes = prizes.map(p => {
                    if (typeof p === 'string') {
                        return { id: Date.now().toString() + Math.random().toString(36).substring(7), text: p, prob: 10, textColor: '#ffffff', bgColor: '#1d4289' };
                    }
                    if(!p.id) p.id = Date.now().toString() + Math.random().toString(36).substring(7);
                    return p;
                });
                renderPrizes();
            }
        } catch(error) {
            console.error(error);
            alert("Lỗi tải cấu hình!");
        }
    }

    function renderPrizes() {
        prizeList.innerHTML = '';
        let total = 0;
        prizes.forEach(prize => {
            total += parseFloat(prize.prob) || 0;
            const row = document.createElement('div');
            row.className = 'prize-row';
            row.innerHTML = `
                <div class="prize-info">
                    <div style="background: ${prize.bgColor}; color: ${prize.textColor}; width: 30px; height: 30px; border-radius: 4px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">A</div>
                    <div>
                        <strong>${prize.text}</strong>
                        <div style="font-size: 0.85rem; color: #64748b;">Trọng số: ${prize.prob}%</div>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button type="button" class="btn btn-secondary btn-edit" data-id="${prize.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Sửa</button>
                    <button type="button" class="btn btn-primary btn-delete" data-id="${prize.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: #ff5252;">Xoá</button>
                </div>
            `;
            prizeList.appendChild(row);
        });

        // Cập nhật tổng hiển thị
        const totalDisplay = document.getElementById('totalProbDisplay');
        const probWarning = document.getElementById('probWarning');
        totalDisplay.textContent = total.toFixed(1);
        
        if (Math.abs(total - 100) > 0.01) {
            probWarning.style.display = 'inline';
        } else {
            probWarning.style.display = 'none';
        }

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => editPrize(e.target.dataset.id));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => deletePrize(e.target.dataset.id));
        });
    }

    prizeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('editId').value;
        const text = document.getElementById('prizeText').value;
        const prob = parseFloat(document.getElementById('prizeProb').value);
        const textColor = document.getElementById('prizeTextColor').value;
        const bgColor = document.getElementById('prizeBgColor').value;

        if (id) {
            // Edit
            const index = prizes.findIndex(p => p.id === id);
            if (index !== -1) {
                prizes[index] = { id, text, prob, textColor, bgColor };
            }
        } else {
            // Add
            prizes.push({
                id: Date.now().toString(),
                text, prob, textColor, bgColor
            });
        }

        renderPrizes();
        prizeForm.reset();
        document.getElementById('editId').value = '';
        btnCancel.style.display = 'none';
    });

    btnCancel.addEventListener('click', () => {
        prizeForm.reset();
        document.getElementById('editId').value = '';
        btnCancel.style.display = 'none';
    });

    function editPrize(id) {
        const prize = prizes.find(p => p.id === id);
        if (prize) {
            document.getElementById('editId').value = prize.id;
            document.getElementById('prizeText').value = prize.text;
            document.getElementById('prizeProb').value = prize.prob;
            document.getElementById('prizeTextColor').value = prize.textColor || '#ffffff';
            document.getElementById('prizeBgColor').value = prize.bgColor || '#1d4289';
            btnCancel.style.display = 'block';
        }
    }

    function deletePrize(id) {
        if(confirm("Bạn có chắc xoá giải này?")) {
            prizes = prizes.filter(p => p.id !== id);
            renderPrizes();
        }
    }

    btnSaveConfig.addEventListener('click', async () => {
        if (prizes.length === 0) {
            alert('Quỹ giải thưởng không thể rỗng!');
            return;
        }

        saveStatus.style.display = 'block';
        try {
            await setDoc(doc(db, "config", "checkin_prizes"), { items: prizes });
            saveStatus.textContent = 'Đã lưu cấu hình lên Firebase thành công!';
            saveStatus.style.color = 'green';
            setTimeout(() => { saveStatus.style.display = 'none'; }, 3000);
        } catch (error) {
            console.error(error);
            saveStatus.textContent = 'Oops! Có lỗi khi lưu Firebase.';
        }
    });

    // ----- ADMIN LOGIC (CONFIG AWARD PRIZES) -----
    const awardPrizeForm = document.getElementById('awardPrizeForm');
    const awardPrizeList = document.getElementById('awardPrizeList');
    const btnCancelAward = document.getElementById('btnCancelAward');
    const btnReloadAwardConfig = document.getElementById('btnReloadAwardConfig');

    if (btnReloadAwardConfig) btnReloadAwardConfig.addEventListener('click', loadAwardConfig);
    
    async function loadAwardConfig() {
        awardPrizeList.innerHTML = '<p>Đang tải dữ liệu...</p>';
        try {
            const snap = await getDocs(collection(db, "award_prizes"));
            awardPrizeList.innerHTML = '';
            snap.forEach(docSnap => {
                const data = docSnap.data();
                const id = docSnap.id;
                const row = document.createElement('div');
                row.className = 'prize-row';
                row.innerHTML = `
                    <div class="prize-info">
                        <div style="background: var(--gold); color: var(--primary); width: 30px; height: 30px; border-radius: 4px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-weight: bold;">T</div>
                        <div>
                            <strong>${data.name}</strong>
                            <div style="font-size: 0.85rem; color: #64748b;">Số lượng: ${data.total} (Còn lại: ${data.remain})</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="button" class="btn btn-secondary btn-edit-award" data-id="${id}" data-name="${data.name}" data-total="${data.total}" data-remain="${data.remain}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Sửa</button>
                        <button type="button" class="btn btn-primary btn-delete-award-config" data-id="${id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: #ff5252;">Xoá</button>
                    </div>
                `;
                awardPrizeList.appendChild(row);
            });

            document.querySelectorAll('.btn-edit-award').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.getElementById('editAwardId').value = e.target.dataset.id;
                    document.getElementById('awardPrizeText').value = e.target.dataset.name;
                    document.getElementById('awardPrizeTotal').value = e.target.dataset.total;
                    document.getElementById('awardPrizeRemain').value = e.target.dataset.remain;
                    btnCancelAward.style.display = 'block';
                });
            });

            document.querySelectorAll('.btn-delete-award-config').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    if(confirm("Bạn có chắc xoá giải này? Hành động này không thể hoàn tác.")) {
                        await deleteDoc(doc(db, "award_prizes", id));
                        loadAwardConfig();
                    }
                });
            });
        } catch(error) {
            console.error(error);
            awardPrizeList.innerHTML = '<p style="color:red">Lỗi tải dữ liệu. Cần cấu hình index Firestore.</p>';
        }
    }

    awardPrizeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editAwardId').value;
        const name = document.getElementById('awardPrizeText').value;
        const total = parseInt(document.getElementById('awardPrizeTotal').value);
        const remain = parseInt(document.getElementById('awardPrizeRemain').value);

        const payload = {
            name: name,
            total: total,
            remain: remain
        };

        try {
            if (id) {
                await setDoc(doc(db, "award_prizes", id), payload);
            } else {
                const newDocRef = doc(collection(db, "award_prizes"));
                await setDoc(newDocRef, payload);
            }
            loadAwardConfig();
            awardPrizeForm.reset();
            document.getElementById('editAwardId').value = '';
            btnCancelAward.style.display = 'none';
        } catch (error) {
            console.error("Lỗi cập nhật giải:", error);
            alert("Đã xảy ra lỗi khi lưu.");
        }
    });

    btnCancelAward.addEventListener('click', () => {
        awardPrizeForm.reset();
        document.getElementById('editAwardId').value = '';
        btnCancelAward.style.display = 'none';
    });

    // ----- ADMIN LOGIC (LIST VIEW & DELETE) -----
    const btnRefreshCheckin = document.getElementById('btnRefreshCheckin');
    const btnRefreshAward = document.getElementById('btnRefreshAward');
    const checkinDataList = document.getElementById('checkinDataList');
    const awardDataList = document.getElementById('awardDataList');

    btnRefreshCheckin.addEventListener('click', loadCheckinList);
    btnRefreshAward.addEventListener('click', loadAwardList);

    // Formatter date
    function formatDate(ts) {
        if (!ts) return '';
        const d = ts.toDate();
        return d.toLocaleString('vi-VN');
    }

    async function loadCheckinList() {
        checkinDataList.innerHTML = '<p>Đang tải dữ liệu...</p>';
        try {
            const q = query(collection(db, "participants"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            if (snap.empty) {
                checkinDataList.innerHTML = '<p>Chưa có dữ liệu.</p>';
                return;
            }
            checkinDataList.innerHTML = '';
            snap.forEach(docSnap => {
                const data = docSnap.data();
                const id = docSnap.id;
                const row = document.createElement('div');
                row.className = 'data-row';
                row.innerHTML = `
                    <div>
                        <strong>${data.name || 'Không tên'}</strong> - ${data.phone || 'Không SĐT'} 
                        <div style="font-size: 0.85rem; color: #64748b;">Giải: ${data.prize || ''} | ${formatDate(data.createdAt)}</div>
                    </div>
                    <button class="btn btn-secondary btn-delete-checkin" data-id="${id}" style="background: #ff5252; color: #fff; padding: 0.3rem 0.6rem; font-size: 0.8rem;">Xoá</button>
                `;
                checkinDataList.appendChild(row);
            });

            document.querySelectorAll('.btn-delete-checkin').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    if(confirm("Xác nhận xoá bản ghi check-in này?")) {
                        await deleteDoc(doc(db, "participants", id));
                        loadCheckinList();
                    }
                });
            });

        } catch(e) {
            console.error(e);
            checkinDataList.innerHTML = '<p style="color:red">Lỗi tải dữ liệu. Cần cấu hình index Firestore (Bấm vào link lỗi trong console để tạo index).</p>';
        }
    }

    async function loadAwardList() {
        awardDataList.innerHTML = '<p>Đang tải dữ liệu...</p>';
        try {
            const q = query(collection(db, "award_winners"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            if (snap.empty) {
                awardDataList.innerHTML = '<p>Chưa có dữ liệu.</p>';
                return;
            }
            awardDataList.innerHTML = '';
            snap.forEach(docSnap => {
                const data = docSnap.data();
                const id = docSnap.id;
                const row = document.createElement('div');
                row.className = 'data-row';
                row.innerHTML = `
                    <div>
                        <strong>${data.name || 'Không tên'}</strong>
                        <div style="font-size: 0.85rem; color: #64748b;">Giải: ${data.prize || ''} | ${formatDate(data.createdAt)}</div>
                    </div>
                    <button class="btn btn-secondary btn-delete-award" data-id="${id}" style="background: #ff5252; color: #fff; padding: 0.3rem 0.6rem; font-size: 0.8rem;">Xoá</button>
                `;
                awardDataList.appendChild(row);
            });

            document.querySelectorAll('.btn-delete-award').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    if(confirm("Xác nhận xoá bản ghi trúng thưởng này?")) {
                        await deleteDoc(doc(db, "award_winners", id));
                        loadAwardList();
                    }
                });
            });

        } catch(e) {
            console.error(e);
            awardDataList.innerHTML = '<p style="color:red">Lỗi tải dữ liệu. Cần cấu hình index Firestore (Bấm vào link lỗi trong console để tạo index).</p>';
        }
    }

});
