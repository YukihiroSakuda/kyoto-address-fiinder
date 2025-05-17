"use client";

import { AddressData } from "@/types";
import { FC, useState, useEffect, useCallback, useRef } from "react";
import AddressResult from "./AddressResult";

type SearchMode = "zipCode" | "address" | "furigana";
type SortOrder =
  | "default"
  | "addressAsc"
  | "addressDesc"
  | "furiganaAsc"
  | "furiganaDesc";

const AddressSearch: FC = () => {
  // 検索関連の状態
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<SearchMode>("zipCode");
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [filteredAddresses, setFilteredAddresses] = useState<AddressData[]>([]);

  // UI状態
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  // ソートと表示制限
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [limit, setLimit] = useState<number>(20);
  const [page, setPage] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);

  // 検索トリガー
  const [shouldSearch, setShouldSearch] = useState<boolean>(false);

  // 前回のソート順を保存するRef
  const prevSortOrderRef = useRef<SortOrder>("default");

  // デバウンス用のタイマーIDを保持するRef
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // JSONデータを読み込む
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/kyoto-addresses.json");
        if (!response.ok) {
          throw new Error("住所データの読み込みに失敗しました");
        }
        const data: AddressData[] = await response.json();
        setAddresses(data);
        setIsDataLoaded(true);
        setIsLoading(false);
      } catch (error) {
        setError(
          "住所データの読み込みに失敗しました。再読み込みしてください。"
        );
        console.error("Error loading address data:", error);
        setIsLoading(false);
      }
    };

    loadAddresses();
  }, []);

  // 結果のソート
  const sortResults = useCallback(
    (results: AddressData[]): AddressData[] => {
      const sortedResults = [...results];

      switch (sortOrder) {
        case "addressAsc":
          sortedResults.sort((a, b) =>
            a.address.localeCompare(b.address, "ja")
          );
          break;
        case "addressDesc":
          sortedResults.sort((a, b) =>
            b.address.localeCompare(a.address, "ja")
          );
          break;
        case "furiganaAsc":
          sortedResults.sort((a, b) =>
            a.furigana.localeCompare(b.furigana, "ja")
          );
          break;
        case "furiganaDesc":
          sortedResults.sort((a, b) =>
            b.furigana.localeCompare(a.furigana, "ja")
          );
          break;
        // デフォルトは郵便番号順
        default:
          sortedResults.sort((a, b) =>
            a.zipCode.localeCompare(b.zipCode, "ja")
          );
          break;
      }

      return sortedResults;
    },
    [sortOrder]
  );

  // 検索結果の処理
  const processSearchResults = useCallback(
    (results: AddressData[]) => {
      if (results.length > 0) {
        setTotalResults(results.length);
        // 結果をソート
        const sortedResults = sortResults(results);
        // まずローディング状態を解除してから結果を更新
        setTimeout(() => {
          setFilteredAddresses(sortedResults);
          setIsLoading(false);
        }, 10);
      } else {
        setError("検索条件に一致する住所が見つかりませんでした");
        setFilteredAddresses([]);
        setTotalResults(0);
        setIsLoading(false);
      }
    },
    [sortResults]
  );

  // 検索実行のエフェクト
  useEffect(() => {
    // 検索フラグが立っていなければ何もしない
    if (!shouldSearch) return;

    const executeSearch = () => {
      // 検索クエリをトリム
      const query = searchQuery.trim();

      if (!query) {
        setError(null);
        setFilteredAddresses([]);
        setTotalResults(0);
        setShouldSearch(false);
        setIsLoading(false);
        return;
      }

      // 郵便番号検索の場合
      if (searchMode === "zipCode") {
        // 数字のみ取り出す（ハイフンは無視）
        const digits = query.replace(/[^\d]/g, "");

        if (digits.length === 0) {
          setError(null);
          setFilteredAddresses([]);
          setTotalResults(0);
          setShouldSearch(false);
          setIsLoading(false);
          return;
        }

        // 数字で始まる郵便番号を検索（部分一致）
        const results = addresses.filter((addr) => {
          const zipDigits = addr.zipCode.replace(/[^\d]/g, "");
          return zipDigits.startsWith(digits);
        });

        processSearchResults(results);
      }
      // 住所検索の場合
      else if (searchMode === "address") {
        // 住所に検索クエリが含まれる住所を検索
        const results = addresses.filter((addr) =>
          addr.address.toLowerCase().includes(query.toLowerCase())
        );
        processSearchResults(results);
      }
      // フリガナ検索の場合
      else if (searchMode === "furigana") {
        // フリガナに検索クエリが含まれる住所を検索
        const results = addresses.filter((addr) =>
          addr.furigana.toLowerCase().includes(query.toLowerCase())
        );
        processSearchResults(results);
      }

      // 検索完了フラグを設定
      setShouldSearch(false);
    };

    // 少し遅延を入れて実行（UIのレスポンシブ性向上のため）
    const timerId = setTimeout(executeSearch, 50);

    // クリーンアップ関数
    return () => {
      clearTimeout(timerId);
    };
  }, [shouldSearch, searchQuery, searchMode, addresses, processSearchResults]);

  // ソート順変更時の処理
  useEffect(() => {
    // ソート順が変更された場合のみ処理を実行
    if (sortOrder !== prevSortOrderRef.current) {
      prevSortOrderRef.current = sortOrder;

      if (filteredAddresses.length > 0 && !isLoading) {
        // 結果を新しいソート順でソート
        const sortedResults = sortResults([...filteredAddresses]);
        setFilteredAddresses(sortedResults);
      }
    }
  }, [filteredAddresses, isLoading, sortOrder, sortResults]);

  // 現在のページに表示する結果
  const currentPageResults = () => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredAddresses.slice(startIndex, endIndex);
  };

  // 検索を開始する関数
  const startSearch = () => {
    // 前回のタイマーをクリア
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 新しいタイマーをセット（200ms遅延 - 高速レスポンス用に短縮）
    debounceTimerRef.current = setTimeout(() => {
      // 検索中は読み込み中のインジケーターだけを表示し、結果は維持する
      setIsLoading(true);
      setPage(1); // 検索時は常に1ページ目から表示
      setShouldSearch(true);
      debounceTimerRef.current = null;
    }, 200);
  };

  // 郵便番号入力ハンドラ（自動フォーマット）
  const handleZipCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 数字とハイフンのみ許可
    const cleaned = value.replace(/[^\d-]/g, "");

    // 自動的にハイフンを挿入
    let formatted = cleaned;
    if (cleaned.length > 3 && !cleaned.includes("-")) {
      formatted = `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}`;
    }

    // 最大8文字（XXX-XXXX）
    setSearchQuery(formatted.substring(0, 8));

    // 入力に応じてリアルタイム検索（最初の数字から検索開始）
    if (formatted.length > 0) {
      startSearch();
    } else {
      // 入力がすべて消えた場合、結果をクリア
      setFilteredAddresses([]);
      setTotalResults(0);
      setError(null);
    }
  };

  // 通常の検索クエリ入力ハンドラ
  const handleQueryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // 入力に応じてリアルタイム検索（1文字目から検索開始）
    if (value.length > 0) {
      startSearch();
    } else if (value.length === 0) {
      // 入力がすべて消えた場合、結果をクリア
      setFilteredAddresses([]);
      setTotalResults(0);
      setError(null);
    }
  };

  // ページ変更ハンドラ
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // 検索モード切替ハンドラ
  const handleSearchModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchMode(e.target.value as SearchMode);
    setSearchQuery(""); // 検索モード変更時に検索クエリをリセット
  };

  // 検索入力フィールドのレンダリング
  const renderSearchInput = () => {
    switch (searchMode) {
      case "zipCode":
        return (
          <input
            type="text"
            id="searchQuery"
            value={searchQuery}
            onChange={handleZipCodeInput}
            placeholder="例: 600-8008"
            className="w-full p-1.5 pr-8 border-0 bg-gray-50 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm shadow-inner"
            maxLength={8}
          />
        );
      case "address":
        return (
          <input
            type="text"
            id="searchQuery"
            value={searchQuery}
            onChange={handleQueryInput}
            placeholder="例: 京都市下京区 長刀鉾町"
            className="w-full p-1.5 pr-8 border-0 bg-gray-50 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm shadow-inner"
          />
        );
      case "furigana":
        return (
          <input
            type="text"
            id="searchQuery"
            value={searchQuery}
            onChange={handleQueryInput}
            placeholder="例: ｷｮｳﾄｼｼﾓｷﾞｮｳｸ ﾅｷﾞﾅﾀﾎﾞｺﾁｮｳ"
            className="w-full p-1.5 pr-8 border-0 bg-gray-50 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm shadow-inner"
          />
        );
      default:
        return null;
    }
  };

  // 説明文のレンダリング
  const renderHelpText = () => {
    switch (searchMode) {
      case "zipCode":
        return "郵便番号の一部を入力すると該当する住所が表示されます";
      case "address":
        return "住所の一部を入力すると該当する住所が表示されます";
      case "furigana":
        return "フリガナの一部を入力すると該当する住所が表示されます";
      default:
        return "";
    }
  };

  // ページネーションの計算
  const totalPages = Math.ceil(totalResults / limit);
  const showPagination = totalResults > limit;

  return (
    <div className="w-full max-w-2xl">
      {/* 京都風モダンデザインの検索フォーム */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow-md border border-amber-100 p-3 relative overflow-hidden">
        {/* 装飾的な模様（和柄パターン）*/}
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
          <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            fill="#B45309"
          >
            <path d="M50,0 L100,50 L50,100 L0,50 Z" />
            <path d="M50,10 L90,50 L50,90 L10,50 Z" />
            <path d="M50,20 L80,50 L50,80 L20,50 Z" />
            <path d="M50,30 L70,50 L50,70 L30,50 Z" />
            <path d="M50,40 L60,50 L50,60 L40,50 Z" />
          </svg>
        </div>

        <h2 className="text-base font-medium text-amber-900 mb-3 flex items-center">
          <svg
            className="w-5 h-5 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z"
              stroke="#B45309"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"
              stroke="#B45309"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          京都府住所フリガナ検索
        </h2>

        <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
          {/* 検索オプションと入力欄を横並びに */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label
                htmlFor="searchMode"
                className="block text-xs font-medium text-amber-800 mb-1"
              >
                検索方法
              </label>
              <select
                id="searchMode"
                value={searchMode}
                onChange={handleSearchModeChange}
                className="block w-full p-1.5 border-0 bg-gray-50 rounded-md focus:ring-amber-500 focus:border-amber-500 text-sm shadow-inner"
              >
                <option value="zipCode">郵便番号</option>
                <option value="address">住所</option>
                <option value="furigana">フリガナ</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="searchQuery"
                className="block text-xs font-medium text-amber-800 mb-1"
              >
                {searchMode === "zipCode"
                  ? "郵便番号"
                  : searchMode === "address"
                  ? "住所"
                  : "フリガナ"}
              </label>
              <div className="relative">
                {renderSearchInput()}
                {isLoading ? (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <svg
                      className="animate-spin h-4 w-4 text-amber-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <svg
                      className="h-4 w-4 text-amber-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-amber-700">{renderHelpText()}</p>
        </form>

        {!isDataLoaded && !error && !isLoading && (
          <div className="text-xs text-amber-700 mt-1">
            住所データを読み込み中...
          </div>
        )}
      </div>

      {/* 検索結果のコントロールパネル - 京都風デザイン */}
      {filteredAddresses.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 p-2 rounded-lg shadow-sm border border-amber-100 text-xs">
          <div className="text-amber-800 mr-2">
            <span className="font-medium">{totalResults}</span> 件 （
            <span className="font-medium">{(page - 1) * limit + 1}</span>〜
            <span className="font-medium">
              {Math.min(page * limit, totalResults)}
            </span>
            件）
          </div>

          <div className="flex flex-wrap gap-2">
            <div>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="p-1 border-0 bg-gray-50 rounded-md text-xs shadow-inner focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="default">郵便番号順</option>
                <option value="addressAsc">住所（昇順）</option>
                <option value="addressDesc">住所（降順）</option>
                <option value="furiganaAsc">フリガナ（昇順）</option>
                <option value="furiganaDesc">フリガナ（降順）</option>
              </select>
            </div>

            <div>
              <select
                id="limit"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="p-1 border-0 bg-gray-50 rounded-md text-xs shadow-inner focus:ring-amber-500 focus:border-amber-500"
              >
                <option value={10}>10件</option>
                <option value={20}>20件</option>
                <option value={50}>50件</option>
                <option value={100}>100件</option>
                <option value={200}>200件</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 検索結果表示 */}
      <AddressResult
        addressResults={currentPageResults()}
        isLoading={isLoading}
        error={error}
      />

      {/* ページネーション - 京都風デザイン */}
      {showPagination && filteredAddresses.length > 0 && (
        <div className="mt-2 mb-4 flex justify-center">
          <nav className="flex items-center flex-wrap gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              className="px-1.5 py-0.5 rounded text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              最初
            </button>
            <button
              onClick={() => handlePageChange(page > 1 ? page - 1 : 1)}
              disabled={page === 1}
              className="px-1.5 py-0.5 rounded text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              前へ
            </button>

            <div className="flex space-x-1 mx-1">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                // 表示するページ番号を計算
                let pageNum = page;
                if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - (6 - i);
                } else {
                  pageNum = page - 3 + i;
                }

                // 有効範囲内のページのみ表示
                if (pageNum > 0 && pageNum <= totalPages) {
                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-2 py-0.5 rounded-md text-xs transition-colors
                        ${
                          pageNum === page
                            ? "bg-amber-600 text-white border border-amber-600"
                            : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}

              {/* 省略記号 */}
              {totalPages > 7 && page < totalPages - 3 && (
                <span className="px-2 py-0.5 text-xs text-amber-800">...</span>
              )}

              {/* 最後のページ */}
              {totalPages > 7 && page < totalPages - 3 && (
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="px-2 py-0.5 rounded-md text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                >
                  {totalPages}
                </button>
              )}
            </div>

            <button
              onClick={() =>
                handlePageChange(page < totalPages ? page + 1 : totalPages)
              }
              disabled={page === totalPages}
              className="px-1.5 py-0.5 rounded text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              次へ
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
              className="px-1.5 py-0.5 rounded text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              最後
            </button>

            <span className="ml-1 text-xs text-amber-700">
              {totalPages > 0 ? `${page}/${totalPages}` : ""}
            </span>
          </nav>
        </div>
      )}
    </div>
  );
};

export default AddressSearch;
