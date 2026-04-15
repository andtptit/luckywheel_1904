import { LuckyWheel } from './wheelUtils.js';
import confetti from 'canvas-confetti';

const PRIZES_CONFIG = [
    { id: 'p1', name: '60.000.000VND', total: 1 },
    { id: 'p2', name: '50.000.000VND', total: 5 },
    { id: 'p3', name: '2 cốc Canh chả cá HQ', total: 2 },
    { id: 'p4', name: '1 cốc Tteokbokki', total: 1 },
    { id: 'p5', name: '2 suất mì Tương đen', total: 1 },
];

document.addEventListener('DOMContentLoaded', () => {
    let candidates = [];
    let prizesState = [...PRIZES_CONFIG].map(p => ({...p, remain: p.total}));
    let activePrizeId = null;

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
    function showResult(winnerName, winIndex) {
        lastWonIdx = winIndex;
        const currentPrize = prizesState.find(p => p.id === activePrizeId);
        
        document.getElementById('winnerName').textContent = winnerName;
        document.getElementById('prizeText').textContent = `Giải thưởng: ${currentPrize.name}`;
        
        resultModal.classList.add('active');
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#c2002f', '#d4af37', '#ffffff'] });

        // Decrease prize count
        currentPrize.remain--;
        if (currentPrize.remain <= 0) {
            activePrizeId = null; // deselect if empty
        }
        renderPrizes();
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
