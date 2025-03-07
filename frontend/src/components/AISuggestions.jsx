
import { useEffect, useState } from "react";
import { debounce } from "lodash";

const AISuggestions = ({ code, language, onSuggestionSelect }) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
        try {
          const response = await fetch("/api/ai/suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, language }),
            credentials: "include" 
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          setSuggestions(data.suggestions?.split("\n") || []);
        } catch (error) {
          console.error("Fetch error:", error);
          setSuggestions([]);
        }
      };

    if (code.length > 10) fetchSuggestions(); 
  }, [code]);

  return (
    <div className="ai-suggestions">
      {suggestions.map((suggestion, index) => (
        <div key={index} onClick={() => onSuggestionSelect(suggestion)}>
          {suggestion}
        </div>
      ))}
    </div>
  );
};

export default AISuggestions;