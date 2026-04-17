import { LuckyWheel } from './wheelUtils.js';
import confetti from 'canvas-confetti';
import { db } from './firebase.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {
    let checkinPrizes = [];
    const wheel = new LuckyWheel('checkinWheel', [], (wonItem) => {
        showResult(wonItem);
    });

    // Lấy quỹ giải thưởng Check-in từ Firebase
    async function fetchPrizes() {
        try {
            const snap = await getDoc(doc(db, "config", "checkin_prizes"));
            if (snap.exists()) {
                const data = snap.data();
                checkinPrizes = data.items || [];
                checkinPrizes = checkinPrizes.map(p => {
                    if (typeof p === 'string') {
                        return { text: p, prob: 10, textColor: '#ffffff', bgColor: '#1d4289', total: 0, remain: 0 };
                    }
                    return {
                        ...p,
                        prob: parseFloat(p.prob) || 0,
                        total: parseInt(p.total) || 0,
                        remain: parseInt(p.remain) || 0
                    };
                });
                wheel.setItems(checkinPrizes);
            }
        } catch(error) {
            console.error("Lỗi tải danh sách giải thưởng:", error);
        }
    }
    fetchPrizes();



    const form = document.getElementById('checkinForm');
    const statusDiv = document.getElementById('checkinStatus');
    const resultModal = document.getElementById('resultModal');
    let currentUserName = '';
    let currentPhone = '';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (wheel.isSpinning) return;

        const name = document.getElementById('fullname').value.trim();
        const phone = document.getElementById('phone').value.trim();

        statusDiv.textContent = 'Đang kiểm tra thông tin...';
        statusDiv.style.color = '#ffeb3b';

        try {
            // Kiểm tra trùng SĐT trên Firestore
            const participantsRef = collection(db, "participants");
            const q = query(participantsRef, where("phone", "==", phone));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                statusDiv.textContent = '❌ Số điện thoại này đã tham gia quay số trước đó!';
                statusDiv.style.color = '#ff5252';
                return;
            }

            // Đủ điều kiện quay
            statusDiv.textContent = 'Đang quay... 🎡';
            currentUserName = name;
            currentPhone = phone;
            
            // Disable button
            form.querySelector('button').disabled = true;

            // Tính toán xác suất trúng (Chỉ những giải còn quà: remain > 0)
            let winIndex = 0;
            const availablePrizes = checkinPrizes.map((p, idx) => ({ ...p, originalIdx: idx }))
                                                .filter(p => (p.remain === undefined || p.remain > 0));

            if (availablePrizes.length === 0) {
                statusDiv.textContent = '❌ Rất tiếc, hiện tại đã hết quà tặng!';
                statusDiv.style.color = '#ff5252';
                form.querySelector('button').disabled = false;
                return;
            }

            const totalProb = availablePrizes.reduce((sum, item) => sum + (parseFloat(item.prob) || 0), 0);
            
            if (totalProb > 0) {
                let random = Math.random() * totalProb;
                for (let i = 0; i < availablePrizes.length; i++) {
                    const prob = parseFloat(availablePrizes[i].prob) || 0;
                    if (random < prob) {
                        winIndex = availablePrizes[i].originalIdx;
                        break;
                    }
                    random -= prob;
                }
            } else {
                // Rơi vào random đều nếu tổng xác suất = 0
                winIndex = availablePrizes[Math.floor(Math.random() * availablePrizes.length)].originalIdx;
            }

            wheel.spin(winIndex);
            
        } catch (error) {
            console.error("Lỗi Firebase:", error);
            statusDiv.textContent = '❌ Lỗi kết nối database! Vui lòng kiểm tra config Firebase.';
            statusDiv.style.color = '#ff5252';
        }
    });

    async function showResult(prize) {
        statusDiv.textContent = 'Quay hoàn tất! Đang lưu kết quả...';
        
        try {
            // Lưu kết quả vào Firestore
            await addDoc(collection(db, "participants"), {
                name: currentUserName,
                phone: currentPhone,
                prize: prize,
                createdAt: serverTimestamp()
            });
            
            statusDiv.textContent = 'Đã lưu kết quả thành công!';

            // TRỪ SỐ LƯỢNG QUÀ TRÊN FIREBASE
            try {
                // Tìm đúng item trong mảng checkinPrizes để trừ remain
                const prizeTextForSearch = typeof prize === 'object' ? prize.text : prize;
                const pIdx = checkinPrizes.findIndex(p => p.text === prizeTextForSearch);
                if (pIdx !== -1 && checkinPrizes[pIdx].remain !== undefined) {
                    checkinPrizes[pIdx].remain = Math.max(0, checkinPrizes[pIdx].remain - 1);
                    // Cập nhật lại toàn bộ document config/checkin_prizes
                    const { setDoc, doc } = await import("firebase/firestore");
                    await setDoc(doc(db, "config", "checkin_prizes"), { items: checkinPrizes });
                    console.log("Đã cập nhật tồn kho Check-in:", prizeTextForSearch);
                }
            } catch (pErr) {
                console.error("Lỗi cập nhật tồn kho:", pErr);
            }
        } catch (error) {
            console.error("Lỗi lưu data:", error);
            statusDiv.textContent = 'Quay xong nhưng lỗi lưu data!';
        }

        // Hiển thị kết quả (backward compatible với string hoặc object)
        const prizeText = typeof prize === 'object' ? prize.text : prize;
        document.getElementById('winnerName').textContent = currentUserName;
        document.getElementById('prizeText').textContent = prizeText;
        resultModal.classList.add('active');

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        // Reset for next
        form.reset();
        form.querySelector('button').disabled = false;
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 5000);
    }
});
