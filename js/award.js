import { SlotMachine } from './slotUtils.js';
import confetti from 'canvas-confetti';
import { db } from './firebase.js';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {
    let candidates = [];
    let prizesState = [];
    let activePrizeId = null;

    // Fetch Award Prizes
    async function loadAwardPrizes() {
        const snap = await getDocs(collection(db, "award_prizes"));
        prizesState = [];
        snap.forEach(docSnap => {
            prizesState.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Sort by prize name for consistency
        prizesState.sort((a,b) => b.name.localeCompare(a.name));
        renderPrizes();
    }
    loadAwardPrizes();

    const slot = new SlotMachine('awardSlotMachine', candidates, (wonName, winIndex) => {
        showResult(wonName, winIndex);
    });

    // Elements
    const candidateInput = document.getElementById('candidateInput');
    const btnLoad = document.getElementById('btnLoadCandidates');
    const listDiv = document.getElementById('candidateList');
    const countSpan = document.getElementById('candidateCount');
    const spinBtn = document.getElementById('spinAwardBtn');
    const stopAwardBtn = document.getElementById('stopAwardBtn');
    const prizeSelector = document.getElementById('prizeSelector');
    const resultModal = document.getElementById('resultModal');

    // Init Prizes UI
    renderPrizes();

    function renderPrizes() {
        prizeSelector.innerHTML = '';
        prizesState.forEach(p => {
            const btn = document.createElement('button');
            btn.className = `prize-option ${activePrizeId === p.id ? 'active' : ''}`;
            btn.innerHTML = `${p.name} <br><small>Còn: ${p.remain}/${p.total}</small>`;
            if (p.remain === 0) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.onclick = () => {
                    activePrizeId = p.id;
                    document.getElementById('currentAwardDisplay').textContent = p.name;
                    renderPrizes();
                    checkSpinReady();
                };
            }
            prizeSelector.appendChild(btn);
        });
    }

    btnLoad.addEventListener('click', () => {
        const text = candidateInput.value.trim();
        if (!text) return;

        candidates = text.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        updateCandidateUI();
        slot.setItems(candidates);
        checkSpinReady();
    });

    function updateCandidateUI() {
        countSpan.textContent = candidates.length;
        listDiv.innerHTML = candidates.map(c => `<div class="candidate-item">${c}</div>`).join('');
    }

    function checkSpinReady() {
        spinBtn.disabled = candidates.length === 0 || !activePrizeId || slot.isSpinning;
    }

    spinBtn.addEventListener('click', () => {
        if (!activePrizeId || candidates.length === 0) return;
        slot.startInfinite();
        
        spinBtn.style.display = 'none';
        stopAwardBtn.style.display = 'block';
        stopAwardBtn.disabled = false;
    });

    stopAwardBtn.addEventListener('click', () => {
        if (!slot.isSpinning) return;
        stopAwardBtn.disabled = true; // Chống click nhiều lần
        stopAwardBtn.textContent = 'ĐANG DỪNG...'; // Cập nhật text hiển thị
        
        const winIndex = Math.floor(Math.random() * candidates.length);
        slot.stop(winIndex);
        
        // Modal sẽ tự động hiện ra nhờ onSpinEnd truyền vào constructor SlotMachine
    });

    let lastWonIdx = -1;
    async function showResult(winnerName, winIndex) {
        lastWonIdx = winIndex;
        const currentPrize = prizesState.find(p => p.id === activePrizeId);
        
        document.getElementById('winnerName').textContent = winnerName;
        document.getElementById('prizeText').textContent = `Giải thưởng: ${currentPrize.name}`;
        
        resultModal.classList.add('active');
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#c2002f', '#d4af37', '#ffffff'] });

        // Decrease prize count locally
        currentPrize.remain--;
        if (currentPrize.remain <= 0) {
            activePrizeId = null; // deselect if empty
        }
        renderPrizes();

        // Cập nhật Bảng Vàng
        const boardList = document.getElementById('goldenBoardList');
        if (boardList.querySelector('p')) {
            boardList.innerHTML = ''; // xóa dòng placeholder
        }
        const winnerEl = document.createElement('div');
        winnerEl.className = 'candidate-item';
        winnerEl.style.flexDirection = 'column';
        winnerEl.style.alignItems = 'flex-start';
        winnerEl.innerHTML = `<strong style="font-size: 1.1rem;">${winnerName}</strong><span style="font-size: 0.85rem; color: var(--primary); font-weight: bold;">${currentPrize.name}</span>`;
        // insert at top
        boardList.insertBefore(winnerEl, boardList.firstChild);

        // Cập nhật lên Firebase
        try {
            const prizeRef = doc(db, "award_prizes", currentPrize.id);
            await updateDoc(prizeRef, { remain: currentPrize.remain });

            // Lưu lịch sử người trúng giải
            await addDoc(collection(db, "award_winners"), {
                name: winnerName,
                prize: currentPrize.name,
                createdAt: serverTimestamp()
            });
        } catch(e) {
            console.error("Lỗi cập nhật số lượng quà lên Firebase:", e);
        }
    }

    // Xóa user sau khi xác nhận
    resultModal.querySelector('.btn-secondary').addEventListener('click', () => {
        if (lastWonIdx !== -1) {
            candidates.splice(lastWonIdx, 1);
            updateCandidateUI();
            slot.setItems(candidates);
            candidateInput.value = candidates.join('\n'); // keep sync
            lastWonIdx = -1;
            
            // Hiện lại nút QUAY sau khi đóng Modal
            spinBtn.style.display = 'block';
            stopAwardBtn.style.display = 'none';
            stopAwardBtn.textContent = 'DỪNG LẠI!'; // Khôi phục text ban đầu
            checkSpinReady();
        }
    });
    // Xóa bộ nhớ Bảng Vàng
    document.getElementById('btnClearGoldenBoard').addEventListener('click', () => {
        if(confirm("Bạn muốn xóa hiển thị Bảng Vàng? (Không ảnh hưởng đến database)")) {
            document.getElementById('goldenBoardList').innerHTML = '<p style="text-align: center; color: #94a3b8; font-style: italic; margin-top: 2rem;">Đang chờ chủ nhân các giải thưởng...</p>';
        }
    });
});
