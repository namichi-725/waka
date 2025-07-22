'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import kimarijidData from '../data/kimariji.json'
import poemDetails from '../data/poem-details.json'

interface KimarijiData {
  id: number
  kimariji: string
  full_kami: string
  shimo_no_ku: string
  author: string
}

interface PoemDetail {
  id: number
  meaning: string
  context: string
  author_profile: string
}

interface QuizResult {
  id: string
  date: string
  mode: 'kimari-to-shimo' | 'shimo-to-kami'
  score: number
  totalQuestions: number
  percentage: number
  timeSpent: number // 秒単位
}

interface UserStats {
  totalQuizzes: number
  averageScore: number
  bestScore: number
  totalCorrectAnswers: number
  totalQuestions: number
  timeSpent: number
  byMode: {
    'kimari-to-shimo': {
      quizzes: number
      correctAnswers: number
      totalQuestions: number
      averageScore: number
    }
    'shimo-to-kami': {
      quizzes: number
      correctAnswers: number
      totalQuestions: number
      averageScore: number
    }
  }
}

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState<KimarijiData | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [questionCount, setQuestionCount] = useState(0)
  const [usedQuestions, setUsedQuestions] = useState<number[]>([])
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizMode, setQuizMode] = useState<'kimari-to-shimo' | 'shimo-to-kami'>('kimari-to-shimo')
  const [modeSelected, setModeSelected] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [showStats, setShowStats] = useState(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [showQuizEndModal, setShowQuizEndModal] = useState(false)
  
  // LocalStorage関数
  const saveQuizResult = (result: QuizResult) => {
    const existingResults = getQuizResults()
    const updatedResults = [...existingResults, result]
    localStorage.setItem('hyakunin-isshu-quiz-results', JSON.stringify(updatedResults))
  }
  
  const getQuizResults = (): QuizResult[] => {
    if (typeof window === 'undefined') return []
    const results = localStorage.getItem('hyakunin-isshu-quiz-results')
    return results ? JSON.parse(results) : []
  }
  
  const calculateUserStats = (): UserStats => {
    const results = getQuizResults()
    
    if (results.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalCorrectAnswers: 0,
        totalQuestions: 0,
        timeSpent: 0,
        byMode: {
          'kimari-to-shimo': { quizzes: 0, correctAnswers: 0, totalQuestions: 0, averageScore: 0 },
          'shimo-to-kami': { quizzes: 0, correctAnswers: 0, totalQuestions: 0, averageScore: 0 }
        }
      }
    }
    
    const totalQuizzes = results.length
    const totalCorrectAnswers = results.reduce((sum, r) => sum + r.score, 0)
    const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0)
    const averageScore = totalQuestions > 0 ? (totalCorrectAnswers / totalQuestions) * 100 : 0
    const bestScore = Math.max(...results.map(r => r.percentage))
    const timeSpent = results.reduce((sum, r) => sum + r.timeSpent, 0)
    
    const kimariStats = results.filter(r => r.mode === 'kimari-to-shimo')
    const shimoStats = results.filter(r => r.mode === 'shimo-to-kami')
    
    return {
      totalQuizzes,
      averageScore,
      bestScore,
      totalCorrectAnswers,
      totalQuestions,
      timeSpent,
      byMode: {
        'kimari-to-shimo': {
          quizzes: kimariStats.length,
          correctAnswers: kimariStats.reduce((sum, r) => sum + r.score, 0),
          totalQuestions: kimariStats.reduce((sum, r) => sum + r.totalQuestions, 0),
          averageScore: kimariStats.length > 0 ? kimariStats.reduce((sum, r) => sum + r.percentage, 0) / kimariStats.length : 0
        },
        'shimo-to-kami': {
          quizzes: shimoStats.length,
          correctAnswers: shimoStats.reduce((sum, r) => sum + r.score, 0),
          totalQuestions: shimoStats.reduce((sum, r) => sum + r.totalQuestions, 0),
          averageScore: shimoStats.length > 0 ? shimoStats.reduce((sum, r) => sum + r.percentage, 0) / shimoStats.length : 0
        }
      }
    }
  }
  
  // 統計情報を読み込み
  useEffect(() => {
    setUserStats(calculateUserStats())
  }, [calculateUserStats])
  
  // クイズ終了時に結果を保存
  const saveCurrentQuizResult = () => {
    const endTime = Date.now()
    const timeSpent = Math.floor((endTime - startTime) / 1000)
    const percentage = questionCount > 0 ? Math.round((score / questionCount) * 100) : 0
    
    const result: QuizResult = {
      id: `quiz_${Date.now()}`,
      date: new Date().toISOString(),
      mode: quizMode,
      score,
      totalQuestions: questionCount,
      percentage,
      timeSpent
    }
    
    saveQuizResult(result)
    setUserStats(calculateUserStats())
  }

  const generateOptions = (correctAnswer: string): string[] => {
    let allAnswers: string[]
    
    if (quizMode === 'kimari-to-shimo') {
      allAnswers = kimarijidData.map(poem => poem.shimo_no_ku)
    } else {
      allAnswers = kimarijidData.map(poem => poem.full_kami)
    }
    
    const incorrectOptions = allAnswers.filter(answer => answer !== correctAnswer)
    
    // ランダムに3つの間違った選択肢を選ぶ
    const shuffledIncorrect = incorrectOptions.sort(() => Math.random() - 0.5).slice(0, 3)
    
    // 正解と間違った選択肢を混ぜる
    const allOptions = [correctAnswer, ...shuffledIncorrect]
    
    // ランダムにシャッフル
    return allOptions.sort(() => Math.random() - 0.5)
  }

  const getRandomQuestion = () => {
    const availableQuestions = kimarijidData.filter(poem => !usedQuestions.includes(poem.id))
    
    if (availableQuestions.length === 0) {
      // 全ての問題を使い切った場合、リセットして続行
      setUsedQuestions([])
      return kimarijidData[Math.floor(Math.random() * kimarijidData.length)]
    }
    
    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
  }

  const startNewQuestion = () => {
    const question = getRandomQuestion()
    setCurrentQuestion(question)
    setUsedQuestions(prev => [...prev, question.id])
    
    let correctAnswer: string
    if (quizMode === 'kimari-to-shimo') {
      correctAnswer = question.shimo_no_ku
    } else {
      correctAnswer = question.full_kami
    }
    
    const newOptions = generateOptions(correctAnswer)
    setOptions(newOptions)
    setSelectedAnswer('')
    setShowResult(false)
  }

  const selectMode = (mode: 'kimari-to-shimo' | 'shimo-to-kami') => {
    setQuizMode(mode)
    setModeSelected(true)
  }

  const startQuiz = () => {
    setQuizStarted(true)
    setStartTime(Date.now())
    startNewQuestion()
  }

  const handleAnswerSelect = (answer: string) => {
    if (!showResult) {
      setSelectedAnswer(answer)
    }
  }

  const checkAnswer = () => {
    if (!currentQuestion) return;
    
    let correctAnswer: string
    if (quizMode === 'kimari-to-shimo') {
      correctAnswer = currentQuestion.shimo_no_ku
    } else {
      correctAnswer = currentQuestion.full_kami
    }

    const correct = selectedAnswer === correctAnswer
    setIsCorrect(correct)
    setShowResult(true)
    setQuestionCount(prev => prev + 1)
    
    if (correct) {
      setScore(prev => prev + 1)
    }
  }

  const nextQuestion = () => {
    startNewQuestion()
  }

  const resetQuiz = () => {
    // クイズ終了時に結果を保存
    if (quizStarted && questionCount > 0) {
      saveCurrentQuizResult()
      setShowQuizEndModal(true)
      return
    }
    
    setQuizStarted(false)
    setModeSelected(false)
    setCurrentQuestion(null)
    setOptions([])
    setSelectedAnswer('')
    setShowResult(false)
    setIsCorrect(false)
    setScore(0)
    setQuestionCount(0)
    setUsedQuestions([])
    setStartTime(0)
  }
  
  const confirmEndQuiz = () => {
    setShowQuizEndModal(false)
    setQuizStarted(false)
    setModeSelected(false)
    setCurrentQuestion(null)
    setOptions([])
    setSelectedAnswer('')
    setShowResult(false)
    setIsCorrect(false)
    setScore(0)
    setQuestionCount(0)
    setUsedQuestions([])
    setStartTime(0)
  }

  if (!quizStarted) {
    if (!modeSelected) {
      return (
        <div className="min-h-screen bg-gray-50 relative overflow-hidden">
          {/* 背景画像レイヤー */}
          <div 
            className="fixed inset-0 z-0"
            style={{
              backgroundImage: 'url(/background.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.1
            }}
          ></div>
          
          {/* 背景オーバーレイ */}
          <div className="fixed inset-0 bg-white bg-opacity-80" style={{ zIndex: 1 }}></div>

          {/* 落ち葉アニメーション背景 */}
          <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
            {[...Array(12)].map((_, i) => {
              // 固定値を使用してSSRとクライアントで一致させる
              const positions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 25, 45, 65];
              const delays = [0, 1, 2, 3, 4, 5, 6, 7, 1.5, 2.5, 3.5, 4.5];
              const durations = [10, 11, 12, 13, 14, 15, 16, 10, 11, 12, 13, 14];
              
              return (
                <div
                  key={i}
                  className={`absolute text-3xl opacity-60 animate-fall-${(i % 3) + 1}`}
                  style={{
                    left: `${positions[i]}%`,
                    animationDelay: `${delays[i]}s`,
                    animationDuration: `${durations[i]}s`
                  }}
                >
                  {['🍂', '🍃', '🍁'][i % 3]}
                </div>
              );
            })}
          </div>
          
          <div className="max-w-4xl mx-auto relative" style={{ zIndex: 20 }}>
            <div className="text-center py-12">
              {/* 戻るリンク */}
              <div className="mb-6">
                <Link
                  href="/"
                  className="text-green-800 hover:text-green-900 transition-colors text-lg font-medium"
                >
                  ← 百人一首一覧に戻る
                </Link>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                百人一首クイズ
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                クイズモードを選択してください
              </p>
              
              {/* 統計情報ボタン */}
              <div className="mb-6">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                >
                  {showStats ? '統計を隠す' : '統計を表示'}
                </button>
              </div>
              
              {/* 統計情報表示 */}
              {showStats && userStats && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">あなたの成績</h2>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-bold text-blue-800 mb-2">総クイズ数</h3>
                      <p className="text-2xl font-bold text-blue-600">{userStats.totalQuizzes}回</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-bold text-green-800 mb-2">平均正答率</h3>
                      <p className="text-2xl font-bold text-green-600">{userStats.averageScore.toFixed(1)}%</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h3 className="font-bold text-yellow-800 mb-2">最高スコア</h3>
                      <p className="text-2xl font-bold text-yellow-600">{userStats.bestScore}%</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h3 className="font-bold text-purple-800 mb-3">決まり字→下の句</h3>
                      <p className="text-sm text-purple-600">
                        {userStats.byMode['kimari-to-shimo'].quizzes}回 | 
                        平均 {userStats.byMode['kimari-to-shimo'].averageScore.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-4">
                      <h3 className="font-bold text-pink-800 mb-3">下の句→上の句</h3>
                      <p className="text-sm text-pink-600">
                        {userStats.byMode['shimo-to-kami'].quizzes}回 | 
                        平均 {userStats.byMode['shimo-to-kami'].averageScore.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-gray-600">
                      総学習時間: {Math.floor(userStats.timeSpent / 60)}分{userStats.timeSpent % 60}秒 | 
                      正解数: {userStats.totalCorrectAnswers}/{userStats.totalQuestions}問
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    クイズモードを選択
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 決まり字から下の句 */}
                    <div 
                      onClick={() => selectMode('kimari-to-shimo')}
                      className="bg-green-50 hover:bg-green-100 rounded-lg p-6 cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-green-300 shadow-sm hover:shadow-md"
                    >
                      <h3 className="text-xl font-bold text-green-800 mb-3">
                        決まり字 → 下の句
                      </h3>
                      <p className="text-gray-700 mb-4">
                        決まり字から正しい下の句を選択するクイズです
                      </p>
                      <div className="text-sm text-gray-600 bg-white p-3 rounded">
                        例：「あき」→「わが衣手は 露にぬれつつ」
                      </div>
                    </div>
                    
                    {/* 下の句から上の句 */}
                    <div 
                      onClick={() => selectMode('shimo-to-kami')}
                      className="bg-blue-50 hover:bg-blue-100 rounded-lg p-6 cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-blue-300 shadow-sm hover:shadow-md"
                    >
                      <h3 className="text-xl font-bold text-blue-800 mb-3">
                        下の句 → 上の句
                      </h3>
                      <p className="text-gray-700 mb-4">
                        下の句から正しい上の句を選択するクイズです
                      </p>
                      <div className="text-sm text-gray-600 bg-white p-3 rounded">
                        例：「わが衣手は 露にぬれつつ」→「秋の田の かりほの庵の 苫をあらみ」
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        {/* 背景画像レイヤー */}
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: 'url(/background.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.08
          }}
        ></div>
        
        {/* 背景オーバーレイ */}
        <div className="fixed inset-0 bg-white bg-opacity-85" style={{ zIndex: 1 }}></div>

        {/* 落ち葉アニメーション背景 */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          {[...Array(10)].map((_, i) => {
            // 固定値を使用してSSRとクライアントで一致させる
            const positions = [15, 35, 55, 75, 95, 5, 25, 45, 65, 85];
            const delays = [0, 1, 2, 3, 4, 5, 1.5, 2.5, 3.5, 4.5];
            const durations = [12, 13, 14, 15, 16, 12, 13, 14, 15, 16];
            
            return (
              <div
                key={i}
                className={`absolute text-3xl opacity-50 animate-fall-${(i % 3) + 1}`}
                style={{
                  left: `${positions[i]}%`,
                  animationDelay: `${delays[i]}s`,
                  animationDuration: `${durations[i]}s`
                }}
              >
                {['🍂', '🍃', '🍁'][i % 3]}
              </div>
            );
          })}
        </div>
        
        <div className="max-w-4xl mx-auto relative" style={{ zIndex: 20 }}>
          <div className="py-12 px-4">
            {/* 戻るリンク */}
            <div className="mb-6 text-center">
              <Link
                href="/"
                className="text-green-800 hover:text-green-900 transition-colors text-lg font-medium"
              >
                ← 百人一首一覧に戻る
              </Link>
            </div>
            
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                百人一首クイズ
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                {quizMode === 'kimari-to-shimo' ? '決まり字から下の句を当てるクイズ' : '下の句から上の句を当てるクイズ'}
              </p>
              <button
                onClick={() => setModeSelected(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-8"
              >
                ← モード選択に戻る
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                クイズのルール
              </h2>
              <div className="max-w-2xl mx-auto">
                <div className="grid gap-4 text-gray-600">
                  {quizMode === 'kimari-to-shimo' ? (
                    <>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                        <p>決まり字（上の句の一部）から正しい下の句を選択してください</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                        <p>4つの選択肢から1つを選んでください</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                        <p>正解・不正解に関わらず和歌の意味が表示されます</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">4</div>
                        <p>いつでもクイズをリセットできます</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                        <p>下の句から正しい上の句を選択してください</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                        <p>4つの選択肢から1つを選んでください</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                        <p>正解・不正解に関わらず和歌の意味が表示されます</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">4</div>
                        <p>いつでもクイズをリセットできます</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={startQuiz}
                className="bg-green-600 text-white px-8 py-4 rounded-lg text-xl font-semibold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                クイズを開始する
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* 背景画像レイヤー */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.05
        }}
      ></div>
      
      {/* 背景オーバーレイ */}
      <div className="fixed inset-0 bg-white bg-opacity-90" style={{ zIndex: 1 }}></div>

      {/* 落ち葉アニメーション背景 */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        {[...Array(8)].map((_, i) => {
          // 固定値を使用してSSRとクライアントで一致させる
          const positions = [20, 40, 60, 80, 10, 30, 50, 70];
          const delays = [0, 1, 2, 3, 4, 2.5, 3.5, 4.5];
          const durations = [14, 15, 16, 17, 14, 15, 16, 17];
          
          return (
            <div
              key={i}
              className={`absolute text-2xl opacity-40 animate-fall-${(i % 3) + 1}`}
              style={{
                left: `${positions[i]}%`,
                animationDelay: `${delays[i]}s`,
                animationDuration: `${durations[i]}s`
              }}
            >
              {['🍂', '🍃', '🍁'][i % 3]}
            </div>
          );
        })}
      </div>
      
      <div className="max-w-4xl mx-auto relative" style={{ zIndex: 20 }}>
        <div className="py-8 px-4">
          {/* ヘッダー */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {quizMode === 'kimari-to-shimo' ? '決まり字 → 下の句' : '下の句 → 上の句'}
              </h1>
              <button
                onClick={resetQuiz}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                クイズを終了
              </button>
            </div>
            
            {/* 進捗とスコア */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">問題数</div>
                <div className="text-2xl font-bold text-blue-600">{questionCount}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">正解数</div>
                <div className="text-2xl font-bold text-green-600">{score}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">正解率</div>
                <div className="text-2xl font-bold text-purple-600">
                  {questionCount > 0 ? Math.round((score / questionCount) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* クイズ内容 */}
          {currentQuestion && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              {/* 問題表示 */}
              <div className="text-center mb-8">
                <h2 className="text-xl text-gray-600 mb-4">
                  {quizMode === 'kimari-to-shimo' 
                    ? 'この決まり字の下の句はどれでしょう？' 
                    : 'この下の句の上の句はどれでしょう？'
                  }
                </h2>
                
                <div className="bg-green-50 rounded-lg p-6 mb-6 border-l-4 border-green-600">
                  <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    {quizMode === 'kimari-to-shimo' 
                      ? `「${currentQuestion.kimariji}」`
                      : currentQuestion.shimo_no_ku
                    }
                  </div>
                  <div className="text-sm text-gray-600">
                    {quizMode === 'kimari-to-shimo' ? '決まり字' : '下の句'}
                  </div>
                </div>
                
                {quizMode === 'kimari-to-shimo' && (
                  <div className="text-gray-600 mb-6 bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">参考：上の句全体</div>
                    <span className="text-lg font-medium">{currentQuestion.full_kami}</span>
                  </div>
                )}
              </div>

              {/* 選択肢 */}
              <div className="space-y-4 mb-8">
                {options.map((option, index) => {
                  const isCorrectAnswer = quizMode === 'kimari-to-shimo' 
                    ? option === currentQuestion.shimo_no_ku
                    : option === currentQuestion.full_kami
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={showResult}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-300 ${
                        selectedAnswer === option
                          ? showResult
                            ? isCorrectAnswer
                              ? 'border-green-500 bg-green-100 text-green-800'
                              : 'border-red-500 bg-red-100 text-red-800'
                            : 'border-blue-500 bg-blue-100 text-blue-800'
                          : showResult && isCorrectAnswer
                          ? 'border-green-500 bg-green-100 text-green-800'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                      } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-500 mr-3 mt-1">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="text-lg leading-relaxed">{option}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* 結果表示 */}
              {showResult && (
                <div className="mt-8">
                  <div className={`p-6 rounded-lg border-l-4 ${
                    isCorrect ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'
                  }`}>
                    <h3 className={`text-xl font-bold mb-4 ${
                      isCorrect ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {isCorrect ? '正解！' : '不正解'}
                    </h3>
                    
                    <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">
                        正解の歌
                      </h4>
                      <div className="text-gray-700 space-y-2">
                        <div className="text-lg leading-relaxed">{currentQuestion.full_kami}</div>
                        <div className="text-lg font-medium text-green-600 leading-relaxed">
                          {currentQuestion.shimo_no_ku}
                        </div>
                        <div className="text-sm text-gray-600 mt-3 pt-3 border-t">
                          作者: {currentQuestion.author}
                        </div>
                      </div>
                    </div>

                    {/* 歌の意味と背景 */}
                    {(() => {
                      const detail = poemDetails.find(d => d.id === currentQuestion.id) as PoemDetail | undefined;
                      return detail ? (
                        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">
                            歌の意味・背景
                          </h4>
                          <div className="space-y-4 text-left">
                            <div>
                              <h5 className="font-medium text-gray-700 mb-1">意味：</h5>
                              <p className="text-gray-600">{detail.meaning}</p>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-700 mb-1">背景：</h5>
                              <p className="text-gray-600">{detail.context}</p>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-700 mb-1">作者について：</h5>
                              <p className="text-gray-600">{detail.author_profile}</p>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* アクションボタン */}
                    <div className="text-center">
                      <button
                        onClick={nextQuestion}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        次の問題
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 答えを確認ボタン */}
              {!showResult && (
                <div className="text-center">
                  <button
                    onClick={checkAnswer}
                    disabled={!selectedAnswer}
                    className={`px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300 ${
                      selectedAnswer
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    答えを確認
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* クイズ終了モーダル */}
      {showQuizEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 50 }}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">クイズ終了！</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600">問題数</div>
                    <div className="text-xl font-bold text-blue-600">{questionCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">正解数</div>
                    <div className="text-xl font-bold text-green-600">{score}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600">正解率</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {questionCount > 0 ? Math.round((score / questionCount) * 100) : 0}%
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  学習時間: {Math.floor((Date.now() - startTime) / 60000)}分{Math.floor(((Date.now() - startTime) % 60000) / 1000)}秒
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                結果を保存しました！<br />
                統計画面で進捗を確認できます。
              </p>
              
              <button
                onClick={confirmEndQuiz}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 w-full"
              >
                メニューに戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
