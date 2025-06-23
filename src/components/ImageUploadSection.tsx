
import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadSectionProps {
  onImageUpload: (imageUrls: string[]) => void;
  uploadedImages: string[];
  selectedImage: string | null;
  onImageSelect: (imageUrl: string) => void;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  onImageUpload,
  uploadedImages,
  selectedImage,
  onImageSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const imageUrls: string[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        imageUrls.push(url);
      }
    });

    onImageUpload([...uploadedImages, ...imageUrls]);
  };

  const removeImage = (imageUrl: string) => {
    const updatedImages = uploadedImages.filter(url => url !== imageUrl);
    onImageUpload(updatedImages);
    if (selectedImage === imageUrl && updatedImages.length > 0) {
      onImageSelect(updatedImages[0]);
    } else if (selectedImage === imageUrl) {
      onImageSelect('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg"
        >
          <Upload className="w-4 h-4" />
          Upload Images
        </Button>
        <span className="text-sm text-muted-foreground">
          Upload one or more intraoral photos
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Uploaded Images</h4>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {uploadedImages.map((imageUrl, index) => (
              <div
                key={index}
                className={`relative flex-shrink-0 group cursor-pointer transition-all duration-200 ${
                  selectedImage === imageUrl
                    ? 'ring-2 ring-primary ring-offset-2'
                    : 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-2'
                }`}
                onClick={() => onImageSelect(imageUrl)}
              >
                <img
                  src={imageUrl}
                  alt={`Upload ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(imageUrl);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
                {selectedImage === imageUrl && (
                  <div className="absolute bottom-1 left-1 bg-primary text-white text-xs px-1 rounded">
                    Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadSection;
