import React from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Upload, X, Brain, Loader2 } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
  onPhotoUpload: () => void;
  onPhotoRemove: (index: number) => void;
  label?: string;
  isAnalyzing?: boolean;
  analyzingInfo?: string;
  showAIFeature?: boolean;
}

export function PhotoGallery({ 
  photos, 
  onPhotoUpload, 
  onPhotoRemove, 
  label = "Photos (optional)",
  isAnalyzing = false,
  analyzingInfo = '',
  showAIFeature = false
}: PhotoGalleryProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium text-gray-600">
          {label}
        </Label>
        {showAIFeature && (
          <div className="flex items-center text-xs text-purple-600">
            <Brain className="h-3 w-3 mr-1" />
            AI Analysis
          </div>
        )}
      </div>
      
      {/* AI Analysis Status */}
      {isAnalyzing && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
          <div className="flex items-center text-purple-700">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span className="text-sm font-medium">{analyzingInfo}</span>
          </div>
          <p className="text-xs text-purple-600 mt-1">
            AI is analyzing the uploaded photo to generate condition notes automatically
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
        {photos.map((photo, photoIndex) => (
          <div key={photoIndex} className="relative group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
              <img
                src={photo}
                alt={`Photo ${photoIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => onPhotoRemove(photoIndex)}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
              {photoIndex + 1}
            </div>
          </div>
        ))}
      </div>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onPhotoUpload}
        disabled={isAnalyzing}
        className="flex items-center gap-1"
      >
        {isAnalyzing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Upload className="h-3 w-3" />
        )}
        {isAnalyzing ? 'Analyzing...' : 'Add Photo'}
      </Button>
      
      {showAIFeature && !isAnalyzing && (
        <p className="text-xs text-gray-500 mt-2">
          Upload photos and AI will automatically analyze room conditions and generate notes
        </p>
      )}
    </div>
  );
}