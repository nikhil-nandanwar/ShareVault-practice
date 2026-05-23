import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import { FileTypeProvider, useFileType } from './context/FileTypeProvider'
import TextUploadSection from './components/TextUploadSection'
import FileUploadSection from './components/FileUploadSection'
import RetrieveContent from './components/RetrieveContent'
import {API_BASE_URL} from './config/api';

const MainContent = () => {
  const { fileType } = useFileType();

  switch (fileType) {
    case 'Text':
      return <TextUploadSection />;
    case 'Files':
      return <FileUploadSection />;
    case 'Retrieve':
      return <RetrieveContent />;
    default:
      return <TextUploadSection />;
  }
};

function App() {
  useEffect(async () => {
    try {
      const response = await axios.post(API_BASE_URL + "/api/hello", {
      });
    } catch (error) {

    }
  }, [])
  return (
    <FileTypeProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center">
        <div className="w-full">
          <Navbar />
        </div>
        <div className="w-[95%] md:w-[85%] lg:w-[70%] max-w-7xl">
          <MainContent />
        </div>
      </div>
    </FileTypeProvider>
  )
}

export default App