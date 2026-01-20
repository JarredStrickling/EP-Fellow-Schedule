import { useEffect, useState } from "react";
import { supabase } from "./App"; // Ensure this points to where your supabase client is initialized

const fellowColors = {
  JS: "#bfdbfe", // Light Blue
  TD: "#bbf7d0", // Light Green
};

export default function DiagnosticHub() {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    async function fetchCards() {
      const { data, error } = await supabase.from("diagnostic_cards").select("*");
      if (data) setCards(data);
    }
    fetchCards();
  }, []);

  if (cards.length === 0) return <div className="p-10 text-center">Loading cases...</div>;

  const currentCard = cards[currentIndex];

  const handleAnswer = (option) => {
    setSelectedOption(option);
    setIsRevealed(true);
  };

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
    setSelectedOption(null);
    setIsRevealed(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Diagnostic Hub</h1>
            <p className="text-gray-500">Mastering EP Maneuvers & Localization</p>
          </div>
          <div className="text-sm font-mono bg-gray-200 px-3 py-1 rounded">
            Case {currentIndex + 1} of {cards.length}
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Clinical Slide Image */}
          <div className="bg-black flex justify-center">
            <img 
              src={currentCard.image_url} 
              alt="EP Trace" 
              className="max-h-[400px] object-contain"
            />
          </div>

          <div className="p-8">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-4" 
                  style={{ backgroundColor: fellowColors.JS }}>
              {currentCard.category}
            </span>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentCard.question}</h2>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCard.options.map((option) => {
                const isCorrect = option === currentCard.correct_answer;
                const isSelected = selectedOption === option;
                
                let btnStyle = "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100";
                if (isRevealed && isCorrect) btnStyle = "bg-[#bbf7d0] border-green-500 text-green-800 shadow-inner";
                if (isRevealed && isSelected && !isCorrect) btnStyle = "bg-red-100 border-red-400 text-red-700";

                return (
                  <button
                    key={option}
                    disabled={isRevealed}
                    onClick={() => handleAnswer(option)}
                    className={`p-4 text-left border-2 rounded-xl transition-all duration-200 font-medium ${btnStyle}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Rationale Reveal */}
            {isRevealed && (
              <div className="mt-8 p-6 rounded-xl border-l-8 border-blue-400 animate-in slide-in-from-bottom-4 duration-500" 
                   style={{ backgroundColor: `${fellowColors.JS}40` }}>
                <h3 className="font-bold text-blue-900 mb-2">Diagnostic Pearl</h3>
                <p className="text-blue-900 leading-relaxed">{currentCard.rationale}</p>
                <button 
                  onClick={nextCard}
                  className="mt-6 w-full py-3 bg-white border border-blue-200 rounded-lg font-bold text-blue-600 hover:bg-blue-50 transition"
                >
                  Next Case →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}