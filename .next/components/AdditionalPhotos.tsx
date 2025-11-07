"use client";

import React from 'react';
import { UPhoto } from '@/lib/types';
import PhotoUpload from './PhotoUpload';

type AdditionalPhotosProps = {
  photos: UPhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<UPhoto[]>>;
};

export default function AdditionalPhotos({ photos, setPhotos }: AdditionalPhotosProps) {
  return (
    <div className="form-section bg-white rounded-xl p-6 shadow-sm fade-in mb-8">
      <h2 className="text-xl font-semibold text-kiwi-dark mb-4 flex items-center">
        <svg 
          className="w-5 h-5 mr-2 text-kiwi-green" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Additional Photos
      </h2>
      <p className="text-gray-600 mb-4">
        Add any additional photos that should appear at the end of the report, before the signature.
      </p>
      <PhotoUpload photos={photos} setPhotos={setPhotos} />
    </div>
  );
}