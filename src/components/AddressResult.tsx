"use client";

import { AddressData } from "@/types";
import { FC } from "react";

interface AddressResultProps {
  addressResults: AddressData[];
  isLoading: boolean;
  error: string | null;
}

const AddressResult: FC<AddressResultProps> = ({
  addressResults,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="mt-2 p-2 bg-amber-50 rounded-md animate-pulse border border-amber-100">
        <p className="text-amber-800 text-sm flex items-center justify-center">
          <svg
            className="animate-spin h-4 w-4 mr-2 text-amber-600"
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
          検索中...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-2 p-2 bg-red-50 rounded-md border border-red-200">
        <p className="text-red-600 text-sm flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          {error}
        </p>
      </div>
    );
  }

  if (!addressResults || addressResults.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="bg-white rounded-lg shadow-md border border-amber-100 overflow-hidden">
        <table className="min-w-full divide-y divide-amber-100">
          <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
            <tr>
              <th
                scope="col"
                className="px-2 py-1.5 text-left text-xs font-medium text-amber-800 uppercase tracking-wider w-24"
              >
                郵便番号
              </th>
              <th
                scope="col"
                className="px-2 py-1.5 text-left text-xs font-medium text-amber-800 uppercase tracking-wider"
              >
                住所
              </th>
              <th
                scope="col"
                className="px-2 py-1.5 text-left text-xs font-medium text-amber-800 uppercase tracking-wider"
              >
                フリガナ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-amber-50">
            {addressResults.map((result, index) => (
              <tr
                key={index}
                className={
                  index % 2 === 0
                    ? "bg-white"
                    : "bg-amber-50/30 hover:bg-amber-50/50 transition-colors"
                }
              >
                <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-amber-900">
                  {result.zipCode}
                </td>
                <td className="px-2 py-1 text-xs text-amber-800">
                  {result.address}
                </td>
                <td className="px-2 py-1 text-xs text-amber-700 tracking-wider">
                  {result.furigana}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddressResult;
