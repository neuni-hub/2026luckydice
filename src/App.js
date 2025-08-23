import React, { useState, useEffect } from 'react';

// Google Apps Script 배포 URL을 여기에 직접 입력합니다.
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz-j4X1mkx4yR6yu6ir6NUasAw9gs0AoJF_dRhInICqHWlqwiOCO8TG6YpeH253N9vBzg/exec";

export default function App() {
  const [uniqueId, setUniqueId] = useState(''); // 사용자가 입력하는 고유번호
  const [loggedInUser, setLoggedInUser] = useState(null); // 로그인된 사용자 정보 (null 또는 { id, name, chances })
  const [chances, setChances] = useState(0); // 현재 로그인된 사용자의 남은 기회
  const [diceResult, setDiceResult] = useState(null); // 주사위 굴리기 결과 (숫자)
  const [isDiceAnimating, setIsDiceAnimating] = useState(false); // 주사위 애니메이션 활성화 상태
  const [message, setMessage] = useState(''); // 사용자에게 표시될 메시지

  // Google Apps Script에 요청 보내는 범용 함수
  const sendRequestToAppsScript = async (action, payload = {}) => {
    if (!GOOGLE_APPS_SCRIPT_URL) {
      setMessage('Google Apps Script URL이 설정되지 않았습니다.');
      console.error('ERROR: GOOGLE_APPS_SCRIPT_URL이 정의되지 않았습니다.');
      return null;
    }

    // URL에 쿼리 파라미터로 액션과 페이로드 추가
    const url = new URL(GOOGLE_APPS_SCRIPT_URL);
    url.searchParams.append('action', action);
    for (const key in payload) {
      url.searchParams.append(key, payload[key]);
    }

    console.log('API 요청 URL:', url.toString()); // 요청 URL 로그

    try {
      // setMessage('서버에 요청 중...'); // 이 부분을 제거했습니다.
      const response = await fetch(url.toString(), {
        method: 'GET', // Apps Script의 doGet 함수를 호출하기 위해 GET 사용
        mode: 'cors', // CORS 정책 준수
      });

      console.log('API 응답 객체:', response); // 원본 응답 객체 로그

      if (!response.ok) {
        const errorText = await response.text(); // 오류 발생 시 응답 텍스트도 가져와서 로그
        console.error('HTTP 에러 발생:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}. Message: ${errorText}`);
      }

      const data = await response.json();
      console.log('API 응답 데이터 (JSON):', data); // 파싱된 JSON 데이터 로그
      return data;
    } catch (error) {
      console.error('Apps Script 요청 실패:', error);
      setMessage(`오류 발생: ${error.message}. 개발자 도구 콘솔을 확인해주세요.`);
      return null;
    }
  };

  // 로그인 처리 함수
  const handleLogin = async () => {
    if (!uniqueId.trim()) {
      setMessage('고유번호를 입력해주세요.');
      return;
    }

    setMessage('서버에 요청 중...'); // 로그인 버튼 클릭 시 여기에만 메시지를 표시합니다.
    console.log('로그인 시도:', uniqueId); // 로그인 시도 로그
    const result = await sendRequestToAppsScript('login', { code: uniqueId });
    console.log('sendRequestToAppsScript 결과:', result); // Apps Script 응답 결과 로그

    if (result && result.status === 'success') {
      const { name, chances: fetchedChances } = result.data;
      setLoggedInUser({ id: uniqueId, name });
      setChances(fetchedChances);
      setDiceResult(null);
      setIsDiceAnimating(false);

      if (fetchedChances > 0) {
        setMessage(`안녕하세요, ${name}님! \n${fetchedChances}번의 기회가 있어요.`);
      } else {
        setMessage(`${name}님, 남은 기회가 없어요.`);
      }
    } else if (result && result.status === 'error') {
      setMessage(result.message); // Apps Script에서 보낸 오류 메시지 표시
      setLoggedInUser(null);
      setChances(0);
      setDiceResult(null);
      setIsDiceAnimating(false);
    } else {
      // result가 null이거나 예상치 못한 형식일 때 (네트워크 오류, JSON 파싱 실패 등)
      setMessage('로그인 중 알 수 없는 오류가 발생했습니다. 개발자 도구 콘솔을 확인해주세요.');
      setLoggedInUser(null);
      setChances(0);
      setDiceResult(null);
      setIsDiceAnimating(false);
    }
  };

  // 주사위 굴리기 처리 함수
  const handleRollDice = async () => {
    if (!loggedInUser) {
      setMessage('먼저 로그인해주세요.');
      return;
    }

    if (chances > 0) {
      // 주사위 애니메이션 시작
      setDiceResult(null);
      setIsDiceAnimating(true);
      setMessage('두구두구...결과는'); // 주사위 굴리는 중 메시지는 그대로 유지

      const roll = Math.floor(Math.random() * 6) + 1; // 클라이언트 측에서 주사위 결과 먼저 생성
      console.log('주사위 굴리기 시도:', loggedInUser.id, '예상 결과:', roll); // 주사위 굴리기 시도 로그

      // Apps Script에 기회 차감 요청
      const result = await sendRequestToAppsScript('rollDice', { code: loggedInUser.id, rollResult: roll });
      console.log('sendRequestToAppsScript (rollDice) 결과:', result); // Apps Script 응답 결과 로그

      if (result && result.status === 'success') {
        const { chances: newChances } = result.data;
        setChances(newChances);

        // 애니메이션 시간 (예: 1.5초) 후에 실제 주사위 결과 표시
        setTimeout(() => {
          setDiceResult(roll);
          setIsDiceAnimating(false); // 애니메이션 종료

          if (newChances === 0) {
            setMessage(`${loggedInUser.name}님, 남은 기회가 없어요.`);
          } else {
            setMessage(`남은 기회: ${newChances}회`);
          }
        }, 1500);
      } else if (result && result.status === 'error') {
        setMessage(result.message);
        setIsDiceAnimating(false); // 오류 시 애니메이션 종료
      } else {
        setMessage('주사위 굴리기 중 알 수 없는 오류가 발생했습니다. 개발자 도구 콘솔을 확인해주세요.');
        setIsDiceAnimating(false); // 오류 시 애니메이션 종료
      }

    } else {
      setMessage(`${loggedInUser.name}님, 남은 기회가 없어요.`);
    }
  };

  // "1,000원으로 한 번 더 굴리기" 버튼 클릭 시 처리 (Apps Script를 통해 기회 추가)
  const handleAddChance = async () => {
    if (!loggedInUser) {
      setMessage('먼저 로그인해주세요.');
      return;
    }
    // setMessage('서버에 요청 중...'); // 기회 추가 시에는 이 메시지를 표시하지 않음
    console.log('기회 추가 시도:', loggedInUser.id); // 기회 추가 시도 로그
    // Apps Script에 기회 추가 요청
    const result = await sendRequestToAppsScript('addChance', { code: loggedInUser.id });
    console.log('sendRequestToAppsScript (addChance) 결과:', result); // Apps Script 응답 결과 로그

    if (result && result.status === 'success') {
      const { chances: newChances } = result.data;
      setChances(newChances);
      setMessage(`${loggedInUser.name}님, 기회가 추가되었습니다!`);
    } else if (result && result.status === 'error') {
      setMessage(result.message);
    } else {
      setMessage('기회 추가 중 알 수 없는 오류가 발생했습니다. 개발자 도구 콘솔을 확인해주세요.');
    }
  };

  return (
    <div
      className="relative flex items-center justify-center h-screen bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage: "url('/bg.jpg')",
      }}
    >
      {/* 화면 전체를 덮는 오버레이 (텍스트 가독성을 높이기 위해) */}
      <div className="absolute inset-0 bg-black opacity-20"></div>

      {/* 중앙 컨텐츠 영역 */}
      <div className="relative z-10 p-4 sm:p-8 md:p-12 lg:p-16 text-white text-center w-full max-w-lg md:max-w-2xl lg:max-w-3xl flex flex-col items-center">
        {/* 메시지 표시 */}
        {message && (
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-3xl leading-relaxed mb-6 font-semibold">
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
              className="w-full max-w-md bg-[#1B1B1B] text-[#f0f0f0] font-bold py-4 sm:py-5 md:py-6 px-6 sm:px-8 md:px-10 rounded-[30px] text-2xl sm:text-3xl md:text-4xl lg:text-4xl shadow-lg hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-gray-600"
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
              src="/character.png" // 캐릭터 이미지도 public 폴더에 넣었다고 가정
              alt="게임 캐릭터"
              className="mb-8 w-32 h-auto md:w-48 lg:w-64 z-20 object-contain"
            />
            {/* 주사위 애니메이션 및 결과 표시 영역 */}
            <div className="relative mb-8 flex items-center justify-center w-full max-w-sm h-auto">
              {isDiceAnimating && (
                <div className="absolute w-32 h-32 bg-gray-300 rounded-lg flex items-center justify-center text-6xl font-bold text-gray-800 shadow-xl dice-toss-animation z-30">
                  ?
                </div>
              )}
              {diceResult && !isDiceAnimating && (
                <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold whitespace-nowrap">
                   {diceResult} 🎲
                </div>
              )}
            </div>

            {chances > 0 ? (
              <button
                onClick={handleRollDice}
                disabled={isDiceAnimating} // 애니메이션 중에는 버튼 비활성화
                className={`w-full max-w-md bg-[#1B1B1B] text-[#f0f0f0] font-bold py-4 sm:py-5 md:py-6 px-6 sm:px-8 md:px-10 rounded-[30px] text-2xl sm:text-3xl md:text-4xl lg:text-4xl shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 ${
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
                className="w-full max-w-md bg-green-700 text-[#f0f0f0] font-bold py-4 sm:py-5 md:py-6 px-6 sm:px-8 md:px-10 rounded-[30px] text-2xl sm:text-3xl md:text-4xl lg:text-4xl leading-relaxed shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-500 whitespace-pre-line"
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
        /* HTML 및 Body가 뷰포트 전체 높이를 차지하도록 설정 */
        html, body, #root {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden; /* 스크롤바 방지 */
        }
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

