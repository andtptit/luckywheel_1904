import { LuckyWheel } from './wheelUtils.js';
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

    const wheel = new LuckyWheel('awardWheel', candidates, (wonName, winIndex) => {
        showResult(wonName, winIndex);
    });

    // Elements
    const candidateInput = document.getElementById('candidateInput');
    const btnLoad = document.getElementById('btnLoadCandidates');
    const listDiv = document.getElementById('candidateList');
    const countSpan = document.getElementById('candidateCount');
    const spinBtn = document.getElementById('spinAwardBtn');
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
        wheel.setItems(candidates);
        checkSpinReady();
    });

    function updateCandidateUI() {
        countSpan.textContent = candidates.length;
        listDiv.innerHTML = candidates.map(c => `<div class="candidate-item">${c}</div>`).join('');
    }

    function checkSpinReady() {
        spinBtn.disabled = candidates.length === 0 || !activePrizeId || wheel.isSpinning;
    }

    spinBtn.addEventListener('click', () => {
        if (!activePrizeId || candidates.length === 0) return;
        wheel.spin();
        checkSpinReady(); // disable button
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
            wheel.setItems(candidates);
            candidateInput.value = candidates.join('\n'); // keep sync
            lastWonIdx = -1;
            checkSpinReady();
        }
    });
});
