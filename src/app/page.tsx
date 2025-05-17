"use client";

import AddressSearch from "@/components/AddressSearch";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 bg-gradient-to-b from-amber-50 to-white">
      {/* 和柄の装飾的な背景要素 (上部) */}
      <div className="absolute top-0 left-0 w-full h-32 overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute inset-0 grid grid-cols-6 gap-1">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-full flex items-center justify-center"
            >
              <svg
                className="w-12 h-12 text-amber-800"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
                <path d="M50,0 L100,50 L50,100 L0,50 Z" />
                <path
                  d="M50,20 L80,50 L50,80 L20,50 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>

      <div className="relative w-full max-w-4xl mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-amber-900">
          京都府住所フリガナ検索アプリ
        </h1>
        <div className="h-1 w-32 bg-gradient-to-r from-amber-600 to-amber-300 rounded mx-auto"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        <AddressSearch />
      </div>

      <footer className="mt-12 text-center text-sm text-amber-700">
        <p>© {new Date().getFullYear()} 京都府住所フリガナ検索</p>
        <p className="mt-1">
          郵便番号、住所、フリガナで京都府の住所情報を検索できます
        </p>
      </footer>

      {/* 和柄の装飾的な背景要素 (下部) */}
      <div className="absolute bottom-0 right-0 w-48 h-48 overflow-hidden opacity-10 pointer-events-none">
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          fill="#B45309"
        >
          <path d="M200,100 A100,100 0 0,1 100,200 A100,100 0 0,1 0,100 A100,100 0 0,1 100,0 A100,100 0 0,1 200,100 Z" />
          <path d="M180,100 A80,80 0 0,1 100,180 A80,80 0 0,1 20,100 A80,80 0 0,1 100,20 A80,80 0 0,1 180,100 Z" />
          <path d="M160,100 A60,60 0 0,1 100,160 A60,60 0 0,1 40,100 A60,60 0 0,1 100,40 A60,60 0 0,1 160,100 Z" />
          <path d="M140,100 A40,40 0 0,1 100,140 A40,40 0 0,1 60,100 A40,40 0 0,1 100,60 A40,40 0 0,1 140,100 Z" />
          <path d="M120,100 A20,20 0 0,1 100,120 A20,20 0 0,1 80,100 A20,20 0 0,1 100,80 A20,20 0 0,1 120,100 Z" />
        </svg>
      </div>
    </main>
  );
}
