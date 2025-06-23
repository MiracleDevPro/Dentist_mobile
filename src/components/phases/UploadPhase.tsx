import React, { DragEvent, ChangeEvent, useState } from 'react';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { ArrowRight } from 'lucide-react';

interface UploadPhaseProps {}

const UploadPhase: React.FC<UploadPhaseProps> = () => {
  const { setUploadedImage, goToNextPhase } = useWorkflow();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setUploadedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleNextClick = () => {
    if (selectedFile) {
      goToNextPhase();
    }
  };
  
  const preventDefaults = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="px-6 py-4 w-full max-w-4xl mx-auto bg-[#ecedef]">
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div
        className="border border-dotted border-gray-500 rounded-lg p-0 cursor-pointer bg-transparent relative overflow-hidden"
        onDragOver={preventDefaults}
        onDragEnter={preventDefaults}
        onDragLeave={preventDefaults}
        onDrop={handleFileDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        {/* Content area */}
        <div className="px-8 pt-8 pb-4 relative z-0">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1">
              <h3 className="text-lg text-black font-manrope font-light mb-2">Upload an Image</h3>
              <p className="text-sm text-black font-manrope font-extralight mb-3">Click or drag&drop an intraoral image.</p>
              
              <p className="text-sm text-black font-manrope font-extralight mb-1">Make sure that:</p>
              <ol className="text-sm text-black font-manrope font-extralight list-decimal ml-5 space-y-1">
                <li className="font-manrope font-extralight">Classic Vita Shade is flush and on the same plane as the target tooth</li>
                <li className="font-manrope font-extralight">Light is uniform (indirect light is best)</li>
              </ol>
            </div>
            
            <div className="flex-1 flex justify-center items-center mt-6 md:mt-0">
              <img 
                src="/images/tooth-illustration.svg" 
                alt="Tooth illustration" 
                className="w-40 h-40 object-contain opacity-80" 
              />
            </div>
          </div>
        </div>
        
        {/* Overlay on top */}
        <div 
          className="absolute inset-0 bg-[#ecedef] opacity-30 pointer-events-none z-10"
        />
      </div>
      
      {/* Next button and image preview section */}
      <div className="mt-4 flex items-center">
        <button
          onClick={handleNextClick}
          disabled={!selectedFile}
          className={`
            flex items-center px-4 py-2 rounded-md transition-colors
            ${!selectedFile
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-800 hover:bg-gray-700 text-white'}
          `}
        >
          Next <ArrowRight className="w-4 h-4 ml-1" />
        </button>
        
        {previewImage && (
          <div className="ml-4">
            <div className="w-12 h-12 rounded-md overflow-hidden border border-gray-300">
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPhase;
