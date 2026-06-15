import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_BASE_URL, ENDPOINTS } from "../config/api";

function TextUploadSection() {
  const [textContent, setTextContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const resetInput = () => {
    setTextContent("");
    setGeneratedCode("");
    setError("");
  };

  const sendToServer = async () => {
    if (!textContent.trim()) {
      setError("Please enter some text to share");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(API_BASE_URL + ENDPOINTS.UPLOAD_TEXT, {
        content: textContent,
      });

      setGeneratedCode(response.data.code);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to upload text");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="container mx-auto px-4 mt-8"
    >
      <div className="relative p-[1px] rounded-xl bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500">
        <div className="relative rounded-xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl p-8">
          <div className="animate-float mb-6">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              Share Your Text
            </h2>
            <p className="text-gray-600">
              Enter your text below to get a sharing code
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-lg">
            <textarea
              name="sendText"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows="6"
              placeholder="Enter your text here..."
              className="w-full p-4 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 resize-none text-gray-700 placeholder-gray-400 bg-white/50"
            />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-[2000ms] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform"></div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-red-500 text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetInput}
              className="px-6 py-3 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-300 border border-gray-200 shadow-sm hover:shadow-md"
            >
              Reset
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={sendToServer}
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-emerald-500 text-white font-medium shadow-md hover:shadow-lg transition-shadow duration-300 disabled:opacity-50"
            >
              {loading ? "Generating Code..." : "Share Text"}
            </motion.button>
          </div>

          <AnimatePresence>
            {generatedCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100 text-center"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Your Sharing Code
                </h3>
                <p className="text-4xl font-bold tracking-wider text-indigo-600 mb-2">
                  {generatedCode}
                </p>
                <p className="text-sm text-gray-500">
                  Share this code with others to let them access your text
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default TextUploadSection;
