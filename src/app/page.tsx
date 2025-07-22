'use client';

import { useState } from 'react';
import Link from 'next/link';
import poems from './data/poems.json';
import poemDetails from './data/poem-details.json';

interface Poem {
  id: number;
  kami_no_ku: string;
  shimo_no_ku: string;
  author: string;
}

interface PoemDetail {
  id: number;
  meaning?: string;
  context?: string;
  author_profile?: string;
}

export default function HomePage() {
  const [selectedPoem, setSelectedPoem] = useState<(Poem & PoemDetail) | null>(null);
  const [showAllPoems, setShowAllPoems] = useState(false);

  const handlePoemClick = (poem: Poem) => {
    const detail = poemDetails.find(detail => detail.id === poem.id);
    setSelectedPoem({ ...poem, ...detail });
  };

  const closeModal = () => {
    setSelectedPoem(null);
  };

  const displayedPoems = showAllPoems ? poems : poems.slice(0, 3);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景画像レイヤー - 正常な背景位置 */}
      <div 
        className="fixed inset-0"
        style={{
          backgroundImage: 'url(/background.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#f0f0f0', // フォールバック色
          opacity: 1,
          zIndex: 2 // 
        }}
      ></div>
      
      {/* 背景オーバーレイ - より薄く */}
      <div className="fixed inset-0 bg-white bg-opacity-20" style={{ zIndex: 1 }}></div>

      {/* 落ち葉アニメーション背景 */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        {/* 落ち葉要素 */}
        {[...Array(20)].map((_, i) => {
          // 固定値を使用してSSRとクライアントで一致させる
          const positions = [15, 25, 35, 45, 55, 65, 75, 85, 95, 5, 20, 30, 40, 50, 60, 70, 80, 90, 10, 90];
          const delays = [0, 1, 2, 3, 4, 5, 6, 7, 0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 1, 2, 3, 4];
          const durations = [8, 9, 10, 11, 12, 8, 9, 10, 11, 12, 8, 9, 10, 11, 12, 8, 9, 10, 11, 12];
          
          return (
            <div
              key={i}
              className={`absolute text-3xl opacity-70 animate-fall-${(i % 3) + 1}`}
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

      {/* メインコンテンツ */}
      <div className="relative" style={{ zIndex: 20 }}>
      {/* ヘッダーセクション */}
      <section className="py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
            百人一首
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            古典和歌の美しい世界へようこそ
          </p>
          
          {/* ナビゲーションボタン */}
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
            <Link
              href="/quiz"
              className="bg-green-800 hover:bg-green-900 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              クイズに挑戦する
            </Link>
            <button 
              onClick={() => document.getElementById('poems-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white border-2 border-green-800 text-green-800 hover:bg-green-800 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300"
            >
              和歌一覧を見る
            </button>
          </div>
        </div>
      </section>

      {/* 紹介セクション */}
      <section className="bg-green-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
              百人一首とは
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              百人一首は、平安時代から鎌倉時代初期にかけての優れた歌人百人の和歌を、一人一首ずつ選んで集めた秀歌撰です。
              藤原定家によって選ばれた一〇〇首の歌は、日本文学の至宝として現在でも多くの人に愛され続けています。
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-green-800 text-4xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">学習</h3>
                <p className="text-gray-600">
                  各歌の意味や背景を詳しく解説。古典文学の理解を深められます。
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-green-800 text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">クイズ</h3>
                <p className="text-gray-600">
                  決まり字クイズで楽しく学習。かるた大会の準備にも最適です。
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-green-800 text-4xl mb-4">💎</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">文化</h3>
                <p className="text-gray-600">
                  日本の美しい古典文化に触れ、感性と教養を育むことができます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 和歌一覧セクション */}
      <section id="poems-section" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
            和歌一覧
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {displayedPoems.map((poem) => (
              <div 
                key={poem.id} 
                className="bg-gray-50 hover:bg-green-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border-l-4 border-green-800"
                onClick={() => handlePoemClick(poem)}
              >
                <div className="flex items-start">
                  <div className="bg-green-800 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0">
                    {poem.id}
                  </div>
                  <div className="flex-grow">
                    <p className="text-lg text-gray-900 leading-relaxed mb-2 font-semibold font-serif">
                      {poem.kami_no_ku}
                    </p>
                    <p className="text-lg text-gray-900 leading-relaxed font-semibold font-serif mb-3">
                      {poem.shimo_no_ku}
                    </p>
                    <div className="flex justify-between items-end">
                      <div></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 和歌カード全体のクリックを防ぐ
                          window.open(`https://www.google.com/search?q=${encodeURIComponent(poem.author + ' 百人一首 歌人')}`, '_blank');
                        }}
                        className="text-gray-600 hover:text-green-800 text-sm transition-colors duration-300 underline hover:no-underline"
                        title={`${poem.author}について検索する`}
                      >
                        — {poem.author} 🔍
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* さらに表示ボタン */}
            {!showAllPoems && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAllPoems(true)}
                  className="bg-green-800 hover:bg-green-900 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  さらに表示
                </button>
              </div>
            )}
            
            {/* 折りたたみボタン */}
            {showAllPoems && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAllPoems(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  折りたたむ
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* フッターセクション */}
      <section className="bg-green-800 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            百人一首で日本の美を学ぼう
          </h2>
          <p className="text-green-100 mb-8">
            古典和歌の世界で、豊かな感性と教養を身につけましょう
          </p>
          <Link
            href="/quiz"
            className="bg-white text-green-800 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300 inline-block"
          >
            今すぐクイズに挑戦
          </Link>
        </div>
      </section>

      {/* モーダルウィンドウ - 可愛いデザイン */}
      {selectedPoem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-green-800">
            <div className="p-8">
              {/* モーダルヘッダー - 装飾的なデザイン */}
              <div className="flex justify-between items-start mb-8">
                <div className="bg-gradient-to-r from-green-800 to-green-900 text-white px-6 py-3 rounded-full shadow-lg">
                  <h2 className="text-2xl font-bold">第{selectedPoem.id}番</h2>
                </div>
                <button 
                  onClick={closeModal}
                  className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 w-12 h-12 rounded-full text-2xl font-bold transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  ×
                </button>
              </div>

              {/* 歌の表示 - 美しい装飾 */}
              <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border-l-8 border-green-800 relative overflow-hidden">
                {/* 装飾的な背景要素 */}
                <div className="absolute top-2 right-2 text-6xl opacity-10">🌸</div>
                <div className="absolute bottom-2 left-2 text-4xl opacity-10">🍃</div>
                
                <div className="relative z-10">
                  <p className="text-2xl text-gray-900 leading-relaxed mb-3 font-semibold font-serif">
                    {selectedPoem.kami_no_ku}
                  </p>
                  <p className="text-2xl text-gray-900 leading-relaxed font-semibold font-serif mb-4">
                    {selectedPoem.shimo_no_ku}
                  </p>
                  <div className="flex items-center justify-end">
                    <span className="text-lg text-gray-600 font-medium mr-2">作者:</span>
                    <button
                      onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedPoem.author + ' 百人一首 歌人')}`, '_blank')}
                      className="bg-green-200 hover:bg-green-300 text-green-900 hover:text-green-950 px-4 py-2 rounded-full font-semibold transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg transform hover:scale-105"
                      title={`${selectedPoem.author}について検索する`}
                    >
                      {selectedPoem.author} 🔍
                    </button>
                  </div>
                </div>
              </div>

              {/* 詳細情報 - カード形式 */}
              {selectedPoem.meaning && (
                <div className="mb-6 p-6 bg-blue-50 rounded-2xl shadow-md border-l-6 border-blue-400">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-3">💭</span>
                    <h3 className="text-xl font-bold text-blue-800">歌の意味</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-lg">{selectedPoem.meaning}</p>
                </div>
              )}

              {selectedPoem.context && (
                <div className="mb-6 p-6 bg-yellow-50 rounded-2xl shadow-md border-l-6 border-yellow-400">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-3">📚</span>
                    <h3 className="text-xl font-bold text-yellow-800">歌の背景</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-lg">{selectedPoem.context}</p>
                </div>
              )}

              {selectedPoem.author_profile && (
                <div className="mb-6 p-6 bg-purple-50 rounded-2xl shadow-md border-l-6 border-purple-400">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-3">👤</span>
                    <h3 className="text-xl font-bold text-purple-800">作者について</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-lg">{selectedPoem.author_profile}</p>
                </div>
              )}

              {/* 詳細データがない場合の表示 - 可愛いメッセージ */}
              {!selectedPoem.meaning && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <div className="text-8xl mb-4">🌸</div>
                  <p className="text-gray-500 text-lg font-medium">詳細情報は準備中です</p>
                  <p className="text-gray-400 text-sm mt-2">もうしばらくお待ちください</p>
                </div>
              )}

              {/* 装飾的なフッター */}
              <div className="mt-8 pt-6 border-t-2 border-green-800 text-center">
                <div className="flex justify-center items-center space-x-4 text-2xl">
                  <span>🌸</span>
                  <span>🍃</span>
                  <span>🌸</span>
                  <span>🍃</span>
                  <span>🌸</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">百人一首の美しい世界</p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}