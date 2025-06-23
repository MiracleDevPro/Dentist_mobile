import React, { useRef, useState, useCallback } from "react";
import { UploadSimple, X } from "phosphor-react";

interface UploadImageProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  selectedImage: string | null;
  onSelectImage: (image: string) => void;
}

const UploadImage: React.FC<UploadImageProps> = ({ images, onImagesChange, selectedImage, onSelectImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const readers = Array.from(files).map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(imgs => {
      const newImages = [...images, ...imgs];
      onImagesChange(newImages);
      if (imgs.length > 0) onSelectImage(imgs[0]);
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const { files } = e.dataTransfer;
      handleFiles(files);
    },
    [handleFiles]
  );

  return (
    <div className="space-y-4">

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={e => handleFiles(e.target.files)}
      />
      
      {/* Drag & Drop Area or Upload Button with Hero Image */}
      <div 
        className={`flex h-96 bg-[#ECEDEF] rounded-2xl border-2 ${isDragging ? 'border-gray-800' : 'border-dashed border-gray-600'} relative overflow-hidden cursor-pointer transition-all duration-300 hover:border-gray-800`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Background content - behind mask */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-row w-full p-8">
            {/* Text content on the left */}
            <div className="w-1/2 flex items-start justify-start pr-4 pt-4">
              <div className="text-left">
                <h3 className="text-xl text-gray-800 mb-3 manrope-light">Upload an Image</h3>
                <p className="text-gray-600 manrope-extralight mb-2">Click or drag&drop an intraoral image.</p>
                <p className="text-gray-600 manrope-extralight mb-1">Make sure that:</p>
                <ol className="text-gray-600 manrope-extralight list-decimal list-outside ml-5 text-sm">
                  <li className="mb-1">Classic Vita Shade is flush and on the same plane as the target tooth</li>
                  <li>Light is uniform (indirect light is best)</li>
                </ol>
              </div>
            </div>
            
            {/* Tooth illustration in the middle */}
            <div className="w-1/2 flex items-center justify-center">
              <img src="/images/tooth-illustration.svg" alt="Tooth illustration" className="w-72 h-72 object-contain opacity-70" />
            </div>
          </div>
        </div>
        
        {/* Semi-transparent mask overlay */}
        <div className="absolute inset-0 bg-[#ECEDEF] opacity-30 z-10"></div>
        
        {/* Only show this when dragging */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <p className="text-gray-800 font-medium bg-white/70 px-4 py-2 rounded-lg">Drop files here!</p>
          </div>
        )}
      </div>
      
      {/* Thumbnail Gallery */}
      {images.length > 0 && (
        <div className="flex overflow-x-auto gap-3 py-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative">
              <img
                src={img}
                alt={`upload-${idx}`}
                className={`w-20 h-20 object-cover rounded-xl transition-all ${selectedImage === img ? 'ring-2 ring-gray-800 ring-offset-2' : 'border border-gray-200'}`}
                onClick={() => onSelectImage(img)}
              />
              {selectedImage === img && (
                <div className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-0.5">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 1L3 7L1 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadImage;
