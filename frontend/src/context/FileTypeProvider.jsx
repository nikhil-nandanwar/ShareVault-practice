import { createContext, useContext, useState } from "react";

const FileTypeContext = createContext();

export const useFileType = () => {
  const context = useContext(FileTypeContext);
  if (!context) {
    throw new Error("useFileType must be used within a FileTypeProvider");
  }
  return context;
};

export const FileTypeProvider = ({ children }) => {
  const [fileType, setFileType] = useState("Text");

  const value = {
    fileType,
    setFileType,
  };

  return (
    <FileTypeContext.Provider value={value}>
      {children}
    </FileTypeContext.Provider>
  );
};

export default FileTypeProvider;
