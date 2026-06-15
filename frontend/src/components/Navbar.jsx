import { motion } from "framer-motion";
import { useFileType } from "../context/FileTypeProvider";

function Navbar() {
  const { fileType, setFileType } = useFileType();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full bg-gradient-to-r from-indigo-500/10 via-emerald-500/10 to-amber-500/10 backdrop-blur-xl border-b border-white/20"
    >
      <div className="w-[95%] md:w-[85%] lg:w-[70%] max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              ShareVault
            </h1>
          </div>
          <div className="flex space-x-2 sm:space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFileType("Text")}
              className={`px-2 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                fileType === "Text"
                  ? "bg-gradient-to-r from-indigo-500 to-emerald-500 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Text
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFileType("Files")}
              className={`px-2 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                fileType === "Files"
                  ? "bg-gradient-to-r from-indigo-500 to-emerald-500 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Files
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFileType("Retrieve")}
              className={`px-2 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                fileType === "Retrieve"
                  ? "bg-gradient-to-r from-indigo-500 to-emerald-500 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Retrieve
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
