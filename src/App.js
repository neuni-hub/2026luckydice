import React, { useState, useEffect } from 'react';

// 시뮬레이션된 사용자 데이터 (실제 환경에서는 백엔드에서 Google Sheet 또는 DB와 연동됩니다)
// 각 고유번호별로 남은 기회 횟수를 저장합니다.
const initialUsersData = {
  'user123': { chances: 3, name: '김코딩' },
  'user456': { chances: 0, name: '이개발' },
  'user789': { chances: 5, name: '박디자인' },
};

export default function App() {
  const [uniqueId, setUniqueId] = useState(''); // 사용자가 입력하는 고유번호
  const [loggedInUser, setLoggedInUser] = useState(null); // 로그인된 사용자 정보 (null 또는 { id, name, chances })
  const [chances, setChances] = useState(0); // 현재 로그인된 사용자의 남은 기회
  const [diceResult, setDiceResult] = useState(null); // 주사위 굴리기 결과 (숫자)
  const [isDiceAnimating, setIsDiceAnimating] = useState(false); // 주사위 애니메이션 활성화 상태
  const [message, setMessage] = useState(''); // 사용자에게 표시될 메시지
  const [usersData, setUsersData] = useState(initialUsersData); // 시뮬레이션된 전체 사용자 데이터

  // 로그인 처리 함수
  const handleLogin = () => {
    // 고유번호가 비어있으면 에러 메시지 표시
    if (!uniqueId.trim()) {
      setMessage('고유번호를 입력해주세요.');
      return;
    }

    // 시뮬레이션된 사용자 데이터에서 고유번호 조회
    const user = usersData[uniqueId];

    if (user) {
      setLoggedInUser({ id: uniqueId, name: user.name });
      setChances(user.chances);
      setDiceResult(null); // 로그인 시 주사위 결과 초기화
      setIsDiceAnimating(false); // 애니메이션 상태 초기화

      // 기회 횟수에 따른 메시지 설정
      if (user.chances > 0) {
        setMessage(`안녕하세요, ${user.name}님! ${user.chances}번의 기회가 있어요.`);
      } else {
        setMessage(`${user.name}님, 남은 기회가 없어요.`);
      }
    } else {
      // 고유번호가 없는 경우
      setMessage('번호를 다시 확인해주세요.');
      setLoggedInUser(null);
      setChances(0);
      setDiceResult(null);
      setIsDiceAnimating(false);
    }
  };

  // 주사위 굴리기 처리 함수
  const handleRollDice = () => {
    if (!loggedInUser) {
      setMessage('먼저 로그인해주세요.');
      return;
    }

    if (chances > 0) {
      // 기회 1회 차감
      const newChances = chances - 1;
      setChances(newChances);

      // 시뮬레이션된 사용자 데이터 업데이트 (실제 구글 시트 연동 시 백엔드에서 처리)
      setUsersData(prevData => ({
        ...prevData,
        [loggedInUser.id]: { ...prevData[loggedInUser.id], chances: newChances }
      }));

      // 주사위 결과 초기화 및 애니메이션 시작
      setDiceResult(null);
      setIsDiceAnimating(true);
      setMessage('주사위를 굴리고 있어요...'); // 주사위 굴리는 중 메시지

      // 애니메이션 시간 (예: 1.5초) 후에 실제 주사위 결과 표시
      setTimeout(() => {
        const roll = Math.floor(Math.random() * 6) + 1;
        setDiceResult(roll);
        setIsDiceAnimating(false); // 애니메이션 종료

        // 최종 메시지 업데이트
        if (newChances === 0) {
          setMessage(`${loggedInUser.name}님, 남은 기회가 없어요.`);
        } else {
          setMessage(`${loggedInUser.name}님! 남은 기회: ${newChances}회`);
        }
      }, 1500); // 1.5초 후에 결과가 나타나도록 설정
    } else {
      // 기회가 없는 경우
      setMessage(`${loggedInUser.name}님, 남은 기회가 없어요.`);
    }
  };

  // "1,000원으로 한 번 더 굴리기" 버튼 클릭 시 처리 (시뮬레이션)
  const handleAddChance = () => {
    if (!loggedInUser) {
      setMessage('먼저 로그인해주세요.');
      return;
    }
    const newChances = chances + 1;
    setChances(newChances);
    setUsersData(prevData => ({
      ...prevData,
      [loggedInUser.id]: { ...prevData[loggedInUser.id], chances: newChances }
    }));
    setMessage(`${loggedInUser.name}님, 1회 기회가 추가되었습니다! 총 ${newChances}번의 기회가 있어요.`);
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage: "url('https://placehold.co/3024x1714/4A90E2/FFFFFF?text=Background+Image')",
      }}
    >
      {/* 화면 전체를 덮는 오버레이 (텍스트 가독성을 높이기 위해) */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* 중앙 컨텐츠 영역 */}
      <div className="relative z-10 p-4 sm:p-8 md:p-12 lg:p-16 text-white text-center w-full max-w-lg md:max-w-2xl lg:max-w-4xl flex flex-col items-center">
        {/* 메시지 표시 */}
        {message && (
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-6 font-semibold">
            {message}
          </p>
        )}

        {/* 로그인 폼 */}
        {!loggedInUser && (
          <div className="flex flex-col items-center space-y-4 w-full">
            <input
              type="text"
              placeholder="고유번호를 입력하세요"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              className="w-full max-w-md p-3 sm:p-4 md:p-5 text-gray-900 bg-white rounded-xl text-lg sm:text-xl md:text-2xl focus:outline-none focus:ring-4 focus:ring-blue-500 transition-all duration-300"
            />
            <button
              onClick={handleLogin}
              className="w-full max-w-md bg-[#1B1B1B] text-[#f0f0f0] font-bold py-4 sm:py-5 md:py-6 px-6 sm:px-8 md:px-10 rounded-[30px] text-2xl sm:text-3xl md:text-4xl lg:text-5xl shadow-lg hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-gray-600"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              LOGIN
            </button>
          </div>
        )}

        {/* 로그인 후 주사위 굴리기 영역 */}
        {loggedInUser && (
          <div className="flex flex-col items-center space-y-6 w-full">
            {/* 캐릭터 이미지 (로그인 후부터 화면에 표시) */}
            <img
              src="https://placehold.co/150x200/FFC0CB/000000?text=Your+Character" // 여기에 직접 그린 캐릭터 이미지 URL을 넣어주세요!
              alt="게임 캐릭터"
              className="mb-8 w-32 h-auto md:w-48 lg:w-64 z-20 object-contain" // 입력칸 위에 중앙 정렬, 하단 마진 추가
            />
            {/* 주사위 애니메이션 및 결과 표시 영역 */}
            <div className="relative mb-8 flex items-center justify-center w-full max-w-sm h-auto">
              {isDiceAnimating && (
                // z-30으로 z-index를 높여 캐릭터(z-20)보다 앞에 보이도록 수정
                <div className="absolute w-32 h-32 bg-gray-300 rounded-lg flex items-center justify-center text-6xl font-bold text-gray-800 shadow-xl dice-toss-animation z-30">
                  ?
                </div>
              )}
              {diceResult && !isDiceAnimating && (
                <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold whitespace-nowrap">
                  🎲 {diceResult} 🎲
                </div>
              )}
            </div>

            {chances > 0 ? (
              <button
                onClick={handleRollDice}
                disabled={isDiceAnimating} // 애니메이션 중에는 버튼 비활성화
                className={`w-full max-w-md bg-[#1B1B1B] text-[#f0f0f0] font-bold py-4 sm:py-5 md:py-6 px-6 sm:px-8 md:px-10 rounded-[30px] text-2xl sm:text-3xl md:text-4xl lg:text-5xl shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 ${
                  isDiceAnimating
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:bg-gray-800 transform hover:scale-105 active:scale-95 focus:ring-gray-600'
                }`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                주사위 굴리기
              </button>
            ) : (
              <button
                onClick={handleAddChance}
                className="w-full max-w-md bg-green-700 text-[#f0f0f0] font-bold py-4 sm:py-5 md:py-6 px-6 sm:px-8 md:px-10 rounded-[30px] text-2xl sm:text-3xl md:text-4xl lg:text-5xl shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-500 whitespace-pre-line"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                1,000원으로{"\n"}한 번 더 굴리기
              </button>
            )}
          </div>
        )}
      </div>

      {/* CSS 애니메이션 스타일 정의 */}
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        }

        @keyframes tossAndSpin {
          0% {
            transform: translate(-50%, 0) rotate(0deg);
            opacity: 1;
            /* 이 위치는 캐릭터의 손 위치와 비슷하게 조정될 수 있습니다 */
          }
          25% {
            transform: translate(-60%, -100px) rotate(90deg); /* 위로 던져지는 느낌 */
            opacity: 1;
          }
          50% {
            transform: translate(-40%, -200px) rotate(180deg); /* 더 높이, 회전 */
            opacity: 1;
          }
          75% {
            transform: translate(-55%, -100px) rotate(270deg); /* 다시 내려오기 시작 */
            opacity: 1;
          }
          100% {
            transform: translate(-50%, 0) rotate(360deg); /* 원래 위치로 돌아오기 (중앙) */
            opacity: 0; /* 애니메이션 끝나면 잠시 숨김 */
          }
        }

        .dice-toss-animation {
          animation: tossAndSpin 1.5s ease-out forwards; /* 1.5초 동안 애니메이션 실행 */
        }
      `}</style>
    </div>
  );
}

