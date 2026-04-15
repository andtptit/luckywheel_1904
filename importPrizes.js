import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD37syxua05lTj0GtkU1-YfSIY6VKyAoxA",
  authDomain: "luckywheel1904.firebaseapp.com",
  projectId: "luckywheel1904",
  storageBucket: "luckywheel1904.firebasestorage.app",
  messagingSenderId: "231784061850",
  appId: "1:231784061850:web:26eca826a1c2b573f7b823"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CHECKIN_PRIZES = [
    'Khóa học say Annyeong',
    'Khóa học E-Learning - xxx',
    'Khóa học E-Learning - xxxxx',
    'Khóa học E-Learning - xxxxxxxxxx'
];

const AWARD_PRIZES = [
    { id: 'p1', name: '60.000.000VND', total: 1, remain: 1 },
    { id: 'p2', name: '50.000.000VND', total: 5, remain: 5 },
    { id: 'p3', name: '2 cốc Canh chả cá HQ', total: 2, remain: 2 },
    { id: 'p4', name: '1 cốc Tteokbokki', total: 1, remain: 1 },
    { id: 'p5', name: '2 suất mì Tương đen', total: 1, remain: 1 },
];

async function importPrizes() {
    console.log("Bắt đầu khởi tạo dữ liệu giải thưởng...");
    try {
        await setDoc(doc(db, "config", "checkin_prizes"), { items: CHECKIN_PRIZES });
        console.log("✅ Đã tạo cấu hình giải check-in");

        for (const prize of AWARD_PRIZES) {
            await setDoc(doc(db, "award_prizes", prize.id), prize);
        }
        console.log("✅ Đã tạo quỹ giải thưởng (Séc)");

    } catch (error) {
        console.error("Lỗi:", error);
    }
    process.exit(0);
}

importPrizes();
